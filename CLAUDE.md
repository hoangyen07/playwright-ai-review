# CLAUDE.md

Behavioral guidelines for AI assistants working in this Playwright (TypeScript) test framework.
Adapted from https://github.com/dvasyliev/evaluating-ai-code.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Project context

- Runner: `@playwright/test`, TypeScript, Chromium only
- System under test: `app/checkout.html`, a demo wallet checkout served by `app/server.mjs` on port 4173. Its state is set through query params (`amount`, `balance`, `spentToday`, `orderId`), which stands in for API data setup.
- Structure:
  - `tests/` — spec files, one feature per folder; test titles start with the test case ID (`TC-xxxx:`)
  - `pages/` — page objects (locators + UI actions, no assertions)
  - `fixtures/` — custom fixtures; tests import `test` and `expect` from here
  - `data/` — business constants, expected messages and the `vnd()` formatter
  - `test-cases/` — source test cases (`TC-xxxx.md`, same folder layout as `tests/`); the reference for coverage checks
  - `examples/` — deliberately broken tests for checking the review skill; never fix them, never run them in CI
- Commands:
  - All tests: `npm test`
  - One file: `npx playwright test tests/<path>.spec.ts`
  - Smoke: `npm run test:smoke`
  - Type check + lint: `npm run check`
- When this setup is moved into another framework, replace this section with that framework's context.

## 1. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly: environment, test account, preconditions, expected data.
- If the test case or spec is ambiguous (missing expected result, unclear precondition), stop and ask. Do not invent expected results.
- If a step cannot be automated reliably (OTP, captcha, third-party redirect), say so and propose an option (API setup, mock, stub) instead of hacking around it.

## 2. Simplicity first

**Minimum code that covers the test case. Nothing speculative.**

- No helpers, fixtures or page objects for single-use code.
- Reuse existing page objects and fixtures before creating new ones. Search the repo first.
- No retries, extra waits or try/catch added "just in case".

## 3. Surgical changes

**Touch only what you must.**

- Don't refactor page objects, fixtures or config unless asked.
- Never change `playwright.config.ts` (timeouts, retries, workers) to make a test pass.
- Never weaken or delete an assertion to make a failing test pass. If the app behavior differs from the expected result, report it as a possible bug.
- Never add `test.skip`, `test.fixme` or `.only` without saying so explicitly.

## 4. Goal-driven execution

**Define success, then verify it.**

- Before writing a test, list the steps and expected results you will automate, mapped to the source test case ID.
- After any change, run the affected tests and report the actual output (passed / failed / flaky). Never claim "done" without a run.
- A new test should be checked to fail when the behavior is broken (e.g. temporarily change an expected value), not only to pass.
- Run `npm run check` before finishing.
