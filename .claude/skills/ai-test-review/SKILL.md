---
name: ai-test-review
description: Review AI-generated Playwright TypeScript tests for whether they actually catch bugs — coverage of the source test case, assertion strength, flakiness, hallucinated APIs, security and structure. Use when reviewing tests an AI assistant wrote, before merging a generated test, or when the user asks to check generated tests.
---

# AI Test Review

Review the tests against every check below in one pass. If the source test case (TestLink / Confluence / spec) and the diff are available, use them; the coverage checks need them, the rest read the files as they stand.

The central question is not "does the test run" but "**would this test fail if the feature were broken?**"

## Checks

**Coverage of the source test case**

- **Missed step**: go through the test case step by step and mark each step and each expected result done, partial or missing.
- **Unrequested scope**: steps, assertions or data not in the test case, including extra navigation, extra API calls, or config changes.
- **Wrong precondition / test data**: setup that differs from the test case's preconditions (balance, amount, account state, spent-today, order id), so the test exercises a different path than the one specified.
- **Wrong expected result**: an assertion whose value differs from the test case (amount, status text, error message, currency format).
- **Incorrect assumption**: decisions made about things the test case left open, such as account type, initial balance, environment, language, or which error appears first.
- **Happy path only**: for payment flows, check whether negative cases exist: insufficient balance, limit exceeded, timeout, duplicate submit, cancelled transaction.

**Assertion strength (does the test catch bugs?)**

- **Missing await**: every `expect(locator)` and every Playwright action without `await`. These pass silently.
- **Weak assertion**: assertions that only check presence/visibility where the test case expects a value or state.
- **Self-fulfilling assertion**: asserting on a value the test itself set, or on data that never passed through the system under test.
- **No assertion**: a test, or a step with an expected result, that ends without any `expect`.
- **Swallowed failure**: try/catch, `.catch(() => {})`, or conditional logic that lets a failing check pass.
- **Mutation check**: for each key assertion, name one realistic product bug (wrong amount, wrong status, missing error) and say whether the test would fail. If it would still pass, report it.
  - Judge the code as it stands in this review. Never reuse a result from an earlier review or an earlier version of the test.
  - Where the app source is in the repo, confirm at least one key mutation by running it: introduce the bug in the app, run the affected test, record the output, then revert with `git checkout -- <file>` and confirm `git status` shows no leftover change. Do not mutate the tests under review.
  - Mark each mutation as **run** (with the actual result) or **reasoned** (from reading the code). If the test fails before reaching the logic under test, or nothing could be run or reasoned, mark the check `—` and say why.

**Hallucinated or wrong API**

- **Non-existent Playwright API**: list every Playwright method, option and assertion used; mark each verified or not against the installed `@playwright/test` version. Verify with tools, not memory:
  - Search the installed type definitions (`node_modules/playwright/types/test.d.ts` for `test`/`expect`, `node_modules/playwright-core/types/types.d.ts` for page/locator methods) for each name, e.g. `grep -n "toHaveText(" node_modules/playwright/types/test.d.ts`.
  - Run the type checker on the file. If the file is excluded from `tsconfig.json` (as `examples/` is), check it directly: `npx tsc --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target es2022 <file>`.
  - Anything not confirmed by one of these is marked **unverified**, not verified.
- **Invented locators**: selectors, test ids, labels or button names not confirmed to exist in the app (DOM, page object, or design). Mark each verified or not.
- **Invented fixtures/helpers**: imports of page objects, fixtures or utilities that don't exist in the repo, or called with the wrong signature.

**Flakiness and reliability**

- **Fixed waits**: any `waitForTimeout`, `setTimeout`, or polling loop.
- **Non-retrying checks**: `isVisible()`, `textContent()`, `count()` read once and asserted with a plain `expect(value)`.
- **Order dependence**: shared mutable state between tests, `test.describe.serial` without justification, data created in one test and used in another.
- **Shared data**: fixed accounts or orders used by tests that can run in parallel and modify them.
- **Fragile locators**: positional CSS (`nth-child`), long XPath, generated class names.
- **Environment coupling**: hard-coded URLs, dates, timezones or amounts that change between environments.

**Structure and quality**

- **Duplicated logic**: steps that already exist in a page object or fixture and were rewritten inline.
- **Assertions in page objects**: page objects that decide pass/fail.
- **Overengineering**: new abstractions, helpers or config used once.
- **Traceability**: test title missing the test case ID or tag.
- **Config tampering**: changes to timeouts, retries, `test.skip`, `.only`, or `expect` timeouts to make a test pass.

**Security**

- **Exposed credentials**: passwords, tokens, OTP secrets, API keys or real card numbers in source, test data or snapshots.
- **Sensitive data in artifacts**: traces, screenshots, videos or logs that would capture real personal or payment data.
- **Dangerous environment**: anything that could run against production or move real money.

## Output

Report findings ranked by severity: **tests that pass while the feature is broken** first, then flaky tests, then failing/crashing tests, cosmetic last. One block each:

```
[high] Weak assertion — success checked by banner only
  tests/payment/wallet.spec.ts:42
  > await expect(page.getByText('Thành công')).toBeVisible();
  What happens: if the backend debits 500.000 đ instead of 50.000 đ, the banner still shows and the test passes
  Fix: also assert the amount on the receipt and the remaining balance
```

One block per root cause. When one defect causes several symptoms (a wrong precondition that also breaks a derived expected value), report it once, list the affected lines in that block, and do not count the symptoms as separate findings.

Do not rewrite the tests under review. Missing tests are the exception: if the coverage checks found missing steps or negative cases, write those tests in full, following `.claude/rules/playwright.md`.

Do not invent issues. A check with nothing to report is a valid result.

End with this checklist, marking each check found, clean, or not applicable:

```
Coverage of the source test case
  ✗ Missed step
  ✓ Unrequested scope
  ✓ Wrong precondition / test data
  ✗ Wrong expected result
  ✓ Incorrect assumption
  ✗ Happy path only

Assertion strength
  ✗ Missing await
  ✗ Weak assertion
  ✓ Self-fulfilling assertion
  ✓ No assertion
  ✓ Swallowed failure
  ✗ Mutation check

Hallucinated or wrong API
  ✓ Non-existent Playwright API
  ✗ Invented locators
  ✓ Invented fixtures/helpers

Flakiness and reliability
  ✗ Fixed waits
  ✓ Non-retrying checks
  ✓ Order dependence
  — Shared data
  ✓ Fragile locators
  ✓ Environment coupling

Structure and quality
  ✓ Duplicated logic
  ✓ Assertions in page objects
  ✓ Overengineering
  ✗ Traceability
  ✓ Config tampering

Security
  ✓ Exposed credentials
  — Sensitive data in artifacts
  ✓ Dangerous environment

✓ clean
✗ finding
— not applicable
```
