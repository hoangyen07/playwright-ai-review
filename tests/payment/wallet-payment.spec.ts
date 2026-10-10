import { test, expect } from '../../fixtures';
import { DAILY_LIMIT_VND, MESSAGES, vnd } from '../../data/test-data';

test.describe('Wallet payment', () => {
  test('TC-1024: pay order with sufficient wallet balance @smoke', async ({ checkoutPage }) => {
    const amount = 50_000;
    const balance = 100_000;
    await checkoutPage.open({ amount, balance });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
    await expect(checkoutPage.txnMessage).toHaveText(`Đã thanh toán ${vnd(amount)}`);
    await expect(checkoutPage.txnId).toHaveText(/^Mã giao dịch: TXN-\d+$/);
    await expect(checkoutPage.balance).toHaveText(vnd(balance - amount));
  });

  test('TC-1025: reject payment when wallet balance is insufficient', async ({ checkoutPage }) => {
    const balance = 30_000;
    await checkoutPage.open({ amount: 50_000, balance });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.failed);
    await expect(checkoutPage.txnMessage).toHaveText(MESSAGES.insufficientBalance);
    await expect(checkoutPage.balance).toHaveText(vnd(balance));
  });

  test('TC-1026: pay with exact balance leaves zero', async ({ checkoutPage }) => {
    await checkoutPage.open({ amount: 50_000, balance: 50_000 });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
    await expect(checkoutPage.balance).toHaveText(vnd(0));
  });

  test('TC-1027: reject payment that exceeds the daily limit', async ({ checkoutPage }) => {
    const balance = 100_000;
    await checkoutPage.open({ amount: 50_000, balance, spentToday: DAILY_LIMIT_VND - 10_000 });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.failed);
    await expect(checkoutPage.txnMessage).toHaveText(MESSAGES.dailyLimitExceeded);
    await expect(checkoutPage.balance).toHaveText(vnd(balance));
  });

  test('TC-1028: payment reaching the daily limit exactly is allowed', async ({ checkoutPage }) => {
    const amount = 50_000;
    await checkoutPage.open({ amount, balance: 100_000, spentToday: DAILY_LIMIT_VND - amount });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
  });

  test('TC-1029: double tap on pay debits only once', async ({ checkoutPage }) => {
    const amount = 50_000;
    const balance = 200_000;
    await checkoutPage.open({ amount, balance });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.payButton.dblclick();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
    await expect(checkoutPage.balance).toHaveText(vnd(balance - amount));
  });

  test('TC-1031: single payment equal to the daily limit is allowed', async ({ checkoutPage }) => {
    const amount = DAILY_LIMIT_VND;
    const balance = 25_000_000;
    await checkoutPage.open({ amount, balance, spentToday: 0 });

    await checkoutPage.chooseMethod('Ví');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
    await expect(checkoutPage.txnMessage).toHaveText(`Đã thanh toán ${vnd(amount)}`);
    await expect(checkoutPage.txnId).toHaveText(/^Mã giao dịch: TXN-\d+$/);
    await expect(checkoutPage.balance).toHaveText(vnd(balance - amount));
  });
});

test.describe('Linked bank payment', () => {
  test('TC-1030: bank payment does not change wallet balance', async ({ checkoutPage }) => {
    const balance = 10_000;
    await checkoutPage.open({ amount: 50_000, balance });

    await checkoutPage.chooseMethod('Ngân hàng liên kết');
    await checkoutPage.pay();

    await expect(checkoutPage.txnStatus).toHaveText(MESSAGES.success);
    await expect(checkoutPage.balance).toHaveText(vnd(balance));
  });
});
