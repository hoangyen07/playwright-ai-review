---
description: Playwright + TypeScript test rules. Applies to spec files, page objects and fixtures.
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "pages/**/*.ts"
  - "fixtures/**/*.ts"
---

# Playwright Rules

Scope: Playwright test code in TypeScript.

## Prefer user-facing locators

CSS/XPath tied to layout breaks on every UI change. Use role, label, text or a dedicated test id.

```ts
// bad
await page.locator('div.form > div:nth-child(3) > button').click();
await page.locator('//*[@id="app"]/div[2]/span').textContent();

// good
await page.getByRole('button', { name: 'Thanh toán' }).click();
await page.getByTestId('order-status').textContent();
```

## Never use fixed waits

`waitForTimeout` is slow when the app is fast and flaky when it is slow.

```ts
// bad
await page.click('#submit');
await page.waitForTimeout(3000);
expect(await page.locator('#status').textContent()).toBe('Success');

// good
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByTestId('status')).toHaveText('Success');
```

## Use web-first assertions

Reading a value then asserting it does not retry. `expect(locator)` retries until timeout.

```ts
// bad
const visible = await page.getByText('Thành công').isVisible();
expect(visible).toBe(true);

// good
await expect(page.getByText('Thành công')).toBeVisible();
```

## Always await Playwright calls and async assertions

A missing `await` on an assertion makes the test pass without checking anything.

```ts
// bad
expect(page.getByTestId('balance')).toHaveText('100.000 đ');
page.getByRole('button', { name: 'Confirm' }).click();

// good
await expect(page.getByTestId('balance')).toHaveText('100.000 đ');
await page.getByRole('button', { name: 'Confirm' }).click();
```

Enable `@typescript-eslint/no-floating-promises` to catch this automatically.

## Assert the outcome, not just presence

"Element exists" passes even when the value is wrong. Assert the business result.

```ts
// bad
await expect(page.getByTestId('amount')).toBeVisible();

// good
await expect(page.getByTestId('amount')).toHaveText('50.000 đ');
await expect(page.getByTestId('txn-status')).toHaveText('Thành công');
```

## Keep assertions in tests, actions in page objects

Page objects describe the UI. Tests decide what is correct.

```ts
// bad — page object asserts
class PaymentPage {
  async pay() {
    await this.payButton.click();
    await expect(this.successBanner).toBeVisible();
  }
}

// good
class PaymentPage {
  async pay() {
    await this.payButton.click();
  }
}

test('pay with wallet', async ({ paymentPage }) => {
  await paymentPage.pay();
  await expect(paymentPage.successBanner).toBeVisible();
});
```

## Each test is independent

Tests run in parallel and in any order. Never rely on state left by another test.

```ts
// bad
let orderId: string;
test('create order', async () => { orderId = await createOrder(); });
test('pay order', async () => { await payOrder(orderId); });

// good
test('pay order', async ({ api }) => {
  const orderId = await api.createOrder({ amount: 50_000 });
  await payOrder(orderId);
});
```

## Set up data through API or fixtures, not UI

UI setup is slow and fails for reasons unrelated to the feature under test.

```ts
// bad — 6 UI steps to create a user before testing one screen
// good
test.beforeEach(async ({ api }) => {
  await api.createUser({ balance: 100_000 });
});
```

## Never hard-code secrets or real payment data

```ts
// bad
await page.getByLabel('Password').fill('P@ssw0rd123');
await page.getByLabel('Card number').fill('4111111111111111');

// good
await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
await page.getByLabel('Card number').fill(testCards.visaSuccess);
```

## Name magic values

```ts
// bad
await expect(page.getByTestId('error')).toHaveText('Vượt hạn mức 20000000');

// good
const DAILY_LIMIT_VND = 20_000_000;
await expect(page.getByTestId('error')).toHaveText(`Vượt hạn mức ${DAILY_LIMIT_VND}`);
```

## Link tests to the source test case

```ts
// bad
test('test 1', async ({ page }) => { /* ... */ });

// good
test('TC-1024: pay order with wallet balance @smoke', async ({ page }) => { /* ... */ });
```

## Don't swallow failures

A try/catch around an action or assertion turns a real failure into a pass.

```ts
// bad
try {
  await expect(page.getByText('OTP')).toBeVisible();
} catch {}

// good — make the branch explicit
if (await page.getByText('OTP').isVisible()) {
  await otpPage.submit(testOtp);
}
```
