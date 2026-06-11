const API_URL = 'https://bank-up-api.netlify.app';

export type TransferResult = {
  transaction_id: string;
  status: string;
  amount: number;
};

export type Transaction = {
  id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  status: string;
  created_at: string;
};

export async function transferFunds(
  token: string,
  sender_account_id: string,
  receiver_account_id: string,
  amount: number
): Promise<TransferResult> {
  const response = await fetch(
    `${API_URL}/api/transactions/transfer`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_account_id,
        receiver_account_id,
        amount,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function getTransactions(
  token: string,
  accountId: string
): Promise<Transaction[]> {
  const res = await fetch(
    `${API_URL}/api/transactions?account_id=${accountId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.transactions;
}