// ── Legacy types (kept for compatibility) ──────────────────────────────────

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

// ── DB types matching the Supabase schema ──────────────────────────────────

export type DbUser = {
  id: string;
  username: string;
  role: 'admin' | 'client';
  failed_attempts: number;
  is_blocked: boolean;
  created_at: string;
};

export type DbAccount = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  is_active: boolean;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type DbLog = {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  created_at: string;
};

// ── API response shapes ────────────────────────────────────────────────────

export type AuthResponse = {
  token: string;
  user: Pick<DbUser, 'id' | 'username' | 'role'>;
};

export type TransferRequest = {
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
};

export type TransferResponse = {
  transaction_id: string;
  status: 'completed';
  amount: number;
};
