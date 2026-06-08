const API_URL = 'https://bank-up-api.netlify.app';

export type AdminUser = {
  id: string;
  username: string;
  role: string;
  failed_attempts: number;
  is_blocked: boolean;
  created_at: string;
};

export type AdminUserDetail = AdminUser & {
  account: {
    id: string;
    account_number: string;
    balance: number;
    is_active: boolean;
  } | null;
};

export type AdminLog = {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  created_at: string;
};

export async function adminGetUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.users;
}

export async function adminGetUser(token: string, userId: string): Promise<AdminUserDetail> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.user;
}

export async function adminToggleBlock(
  token: string,
  userId: string,
  is_blocked: boolean,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_blocked }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}

export async function adminGetLogs(token: string, userId?: string): Promise<AdminLog[]> {
  const url = userId
    ? `${API_URL}/api/logs?user_id=${userId}`
    : `${API_URL}/api/logs`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.logs;
}
