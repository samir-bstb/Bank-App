import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { signInWithPassword: vi.fn() },
  },
}));

import { POST } from '@/app/api/auth/login/route';
import { supabase } from '@/lib/supabase';

const ALICE_PROFILE = {
  id: 'user-alice',
  username: 'alice',
  role: 'client',
  failed_attempts: 0,
  is_blocked: false,
};

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('returns 400 when body is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'username_and_password_required' });
  });

  it('returns 401 when username does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: null }) as ReturnType<typeof supabase.from>,
    );
    const res = await POST(makeRequest({ username: 'unknown', password: 'pass' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 403 when account is already blocked', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({ data: { ...ALICE_PROFILE, is_blocked: true }, error: null }) as ReturnType<
          typeof supabase.from
        >,
      )
      .mockReturnValue(
        makeChain({ data: null, error: null }) as ReturnType<typeof supabase.from>,
      );

    const res = await POST(makeRequest({ username: 'alice', password: 'wrong' }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'account_blocked' });
  });

  it('returns 401 on invalid credentials', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_PROFILE, error: null }) as ReturnType<typeof supabase.from>,
    );
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' } as never,
    });

    const res = await POST(makeRequest({ username: 'alice', password: 'wrong' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 403 after 5 failed attempts (account gets blocked)', async () => {
    // Profile already has 4 failed attempts — this is the 5th
    const profileWith4Attempts = { ...ALICE_PROFILE, failed_attempts: 4 };

    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: profileWith4Attempts, error: null }) as ReturnType<typeof supabase.from>,
    );
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' } as never,
    });

    const res = await POST(makeRequest({ username: 'alice', password: 'wrong' }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'account_blocked' });
  });

  it('returns 200 with token and user on valid credentials', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_PROFILE, error: null }) as ReturnType<typeof supabase.from>,
    );
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: { access_token: 'jwt-token-abc' } as never,
        user: {} as never,
      },
      error: null,
    });

    const res = await POST(makeRequest({ username: 'alice', password: 'Alice1234!' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('jwt-token-abc');
    expect(body.user).toEqual({ id: 'user-alice', username: 'alice', role: 'client' });
  });
});
