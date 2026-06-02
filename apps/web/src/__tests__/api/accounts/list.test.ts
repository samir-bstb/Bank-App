import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { GET } from '@/app/api/accounts/route';
import { supabase } from '@/lib/supabase';

const ALICE_ACCOUNTS = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'user-alice',
    account_number: '0001234567',
    balance: 5000.0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

function makeRequest(userId = 'user-alice') {
  return new NextRequest('http://localhost:3000/api/accounts', {
    headers: { 'x-user-id': userId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/accounts', () => {
  it('returns 200 with active accounts for the authenticated user', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_ACCOUNTS, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ accounts: ALICE_ACCOUNTS });
  });

  it('returns 200 with empty array when user has no accounts', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: [], error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ accounts: [] });
  });

  it('returns 500 when database query fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'DB error' } }) as ReturnType<
        typeof supabase.from
      >,
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'failed_to_fetch_accounts' });
  });
});
