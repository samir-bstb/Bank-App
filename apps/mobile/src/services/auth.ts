export type User = {
  id: string;
  username: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

const API_URL = 'https://bank-up-api.netlify.app';

export async function loginRequest(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}