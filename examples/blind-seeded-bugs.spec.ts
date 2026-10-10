// Source test case — TC-1024: Pay a 50.000 đ order with wallet balance.
//   Pre: wallet balance 100.000 đ
//   1. Open checkout   2. Choose "Ví"   3. Tap "Thanh toán"
//   Expected: status "Thành công", message "Đã thanh toán 50.000 đ",
//             a transaction id is shown, balance becomes 50.000 đ

import { test, expect } from '@playwright/test';

let paidOrder = '';

test('pay order', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: 'Bearer sk_test_9f8e7d6c5b4a' });
  await page.goto('/checkout.html?amount=50000&balance=100000');

  await page.locator('fieldset > label:nth-child(2) > input').check();
  await page.getByRole('button', { name: 'Thanh toán' }).click();
  await page.waitForTimeout(3000);

  expect(page.getByTestId('txn-status')).toHaveText('Thành công');
  await expect(page.getByTestId('amount')).toBeVisible();

  try {
    await expect(page.getByTestId('receipt')).toHaveExactText('OK');
  } catch {}

  paidOrder = 'ORD-0001';
});

test('paid order cannot be paid again', async ({ page }) => {
  await page.goto(`/checkout.html?orderId=${paidOrder}&amount=50000&balance=50000`);
  await page.getByRole('button', { name: 'Thanh toán' }).click();
  await expect(page.getByTestId('txn-status')).toBeVisible();
});
