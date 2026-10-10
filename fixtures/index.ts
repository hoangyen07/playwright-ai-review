import { test as base } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';

type Fixtures = {
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
