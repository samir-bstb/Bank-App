export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type Account = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
};
