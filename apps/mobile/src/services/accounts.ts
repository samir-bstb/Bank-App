const API_URL = 'https://bank-up-api.netlify.app';

export type Account = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  is_active: boolean;
  created_at: string;
};

export async function getAccounts(
  token: string
): Promise<Account[]> {
  const response = await fetch(
    `${API_URL}/api/accounts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data.accounts;
}