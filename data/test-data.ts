/** Business constants mirrored from the system under test. Keep in sync with the spec. */
export const DAILY_LIMIT_VND = 20_000_000;

/** Format a number the way the app displays VND: 50000 -> "50.000 đ". */
export const vnd = (amount: number): string =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

export const MESSAGES = {
  success: 'Thành công',
  failed: 'Thất bại',
  insufficientBalance: 'Số dư ví không đủ',
  dailyLimitExceeded: `Vượt hạn mức giao dịch trong ngày ${vnd(DAILY_LIMIT_VND)}`,
} as const;
