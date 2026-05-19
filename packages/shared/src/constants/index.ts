export const APP_NAME = 'Bank App';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const TRANSACTION_TYPES = ['credit', 'debit'] as const;
