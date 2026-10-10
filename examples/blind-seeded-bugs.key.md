# Answer key — blind-seeded-bugs.spec.ts

Do not open this file during the review. Use it afterwards to score the report.

Line numbers refer to `examples/blind-seeded-bugs.spec.ts`.

## Seeded bugs (same as `seeded-bugs.spec.ts` [1]–[11])

| # | Check | Line | Bug |
|---|---|---|---|
| 1 | Exposed credentials | 12 | Hard-coded bearer token |
| 2 | Fragile locators | 15 | `fieldset > label:nth-child(2) > input` |
| 3 | Fixed waits | 17 | `waitForTimeout(3000)` |
| 4 | Missing await | 19 | `expect(...txn-status).toHaveText` without `await` |
| 5 | Weak assertion | 20 | Amount only checked with `toBeVisible()` |
| 6 | Missed step / No assertion | 27 | Message, transaction id and balance never asserted |
| 7 | Swallowed failure | 22-24 | Empty `try/catch` |
| 8 | Non-existent Playwright API | 23 | `toHaveExactText` |
| 9 | Invented locators | 23 | `data-testid="receipt"` is not in the app |
| 10 | Order dependence | 9, 26, 31 | Second test reads `paidOrder` set by the first |
| 11 | Traceability | 11, 30 | Titles have no test case ID |

## Known extras (found in the first, non-blind review)

| # | Check | Line | Bug |
|---|---|---|---|
| E1 | Self-fulfilling assertion | 20 | `amount` is rendered on page load from the test's own query param |
| E2 | Weak assertion / Unrequested scope | 30-33 | "cannot be paid again" passes when the second payment succeeds |
| E3 | Order dependence | 31 | Empty `orderId` falls back to `ORD-0001`, so the shared variable has no effect |
| E4 | Fragile locators | 15 | `nth-child(2)` happens to hit the radio that is already checked by default |
| E5 | Non-existent Playwright API | 23 | `examples/` is excluded from `tsconfig.json`, so `npm run check` never sees the fake matcher |

## Scoring

- **Recall:** seeded bugs found / 11. Count a bug as found only if the report names it at the right line with the right check.
- **Extras:** how many of E1–E5 were found, plus any new valid findings.
- **False positives:** findings that are wrong or invented. Each one is a cost, not a bonus.
