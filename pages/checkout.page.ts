import type { Locator, Page } from '@playwright/test';

export type PaymentMethod = 'Ví' | 'Ngân hàng liên kết';

export interface CheckoutState {
  orderId?: string;
  amount: number;
  balance: number;
  spentToday?: number;
}

/** Checkout screen. Locators and UI actions only — assertions live in tests. */
export class CheckoutPage {
  private readonly page: Page;
  readonly orderId: Locator;
  readonly amount: Locator;
  readonly balance: Locator;
  readonly payButton: Locator;
  readonly txnStatus: Locator;
  readonly txnMessage: Locator;
  readonly txnId: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderId = page.getByTestId('order-id');
    this.amount = page.getByTestId('amount');
    this.balance = page.getByTestId('balance');
    this.payButton = page.getByRole('button', { name: 'Thanh toán' });
    this.txnStatus = page.getByTestId('txn-status');
    this.txnMessage = page.getByTestId('txn-message');
    this.txnId = page.getByTestId('txn-id');
  }

  /** Open the checkout with preset state (stands in for API/fixture data setup). */
  async open(state: CheckoutState): Promise<void> {
    const params = new URLSearchParams({
      orderId: state.orderId ?? 'ORD-0001',
      amount: String(state.amount),
      balance: String(state.balance),
      spentToday: String(state.spentToday ?? 0),
    });
    await this.page.goto(`/checkout.html?${params}`);
  }

  async chooseMethod(method: PaymentMethod): Promise<void> {
    await this.page.getByRole('radio', { name: method }).check();
  }

  async pay(): Promise<void> {
    await this.payButton.click();
  }
}
