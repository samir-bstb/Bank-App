const API_URL = 'https://bank-up-api.netlify.app';

export type UserProfile = {
  id: string;
  username: string;
  role: string;
  created_at: string;
};

export async function getUserMe(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.user;
}
