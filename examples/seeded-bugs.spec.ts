// Seeded-bug test for validating the ai-test-review skill.
// Ask Claude Code: "use ai-test-review on examples/seeded-bugs.spec.ts against TC-1024"
// and check the report contains every bug listed below.
// This folder is excluded from `npm test` (see playwright.config.ts).
//
// Source test case — TC-1024: Pay a 50.000 đ order with wallet balance.
//   Pre: wallet balance 100.000 đ
//   1. Open checkout   2. Choose "Ví"   3. Tap "Thanh toán"
//   Expected: status "Thành công", message "Đã thanh toán 50.000 đ",
//             a transaction id is shown, balance becomes 50.000 đ
//
// Seeded bugs:
//   [1]  Hard-coded credential (bearer token)
//   [2]  Positional CSS locator
//   [3]  Fixed wait
//   [4]  Missing await on assertion — passes without checking
//   [5]  Weak assertion — amount is only checked for visibility
//   [6]  Expected result never asserted — remaining balance, transaction id
//   [7]  Swallowed failure via try/catch
//   [8]  Hallucinated API — toHaveExactText does not exist
//   [9]  Invented locator — data-testid="receipt" is not in the app
//   [10] Order dependence — second test relies on state from the first
//   [11] Title without test case ID

import { test, expect } from '@playwright/test';

let paidOrder = '';

test('pay order', async ({ page }) => {                                        // [11]
  await page.setExtraHTTPHeaders({ Authorization: 'Bearer sk_test_9f8e7d6c5b4a' }); // [1]
  await page.goto('/checkout.html?amount=50000&balance=100000');

  await page.locator('fieldset > label:nth-child(2) > input').check();         // [2]
  await page.getByRole('button', { name: 'Thanh toán' }).click();
  await page.waitForTimeout(3000);                                             // [3]

  expect(page.getByTestId('txn-status')).toHaveText('Thành công');            // [4]
  await expect(page.getByTestId('amount')).toBeVisible();                     // [5]

  try {
    await expect(page.getByTestId('receipt')).toHaveExactText('OK');          // [7] [8] [9]
  } catch {}

  paidOrder = 'ORD-0001';
  // [6] balance and transaction id never checked
});

test('paid order cannot be paid again', async ({ page }) => {                  // [10] [11]
  await page.goto(`/checkout.html?orderId=${paidOrder}&amount=50000&balance=50000`);
  await page.getByRole('button', { name: 'Thanh toán' }).click();
  await expect(page.getByTestId('txn-status')).toBeVisible();
});
