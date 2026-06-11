import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { GET } from '@/app/api/accounts/[id]/route';
import { supabase } from '@/lib/supabase';

const ALICE_ACCOUNT = {
  id: 'b0000000-0000-0000-0000-000000000001',
  user_id: 'user-alice',
  account_number: '0001234567',
  balance: 5000.0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

function makeRequest(accountId: string, userId = 'user-alice') {
  return new NextRequest(`http://localhost:3000/api/accounts/${accountId}`, {
    headers: { 'x-user-id': userId },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/accounts/:id', () => {
  it('returns 200 with account detail for own account', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_ACCOUNT, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(
      makeRequest(ALICE_ACCOUNT.id),
      makeParams(ALICE_ACCOUNT.id),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ account: ALICE_ACCOUNT });
  });

  it('returns 404 when account belongs to another user', async () => {
    // Query filters by user_id, so another user's account returns no data
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'Row not found' } }) as ReturnType<
        typeof supabase.from
      >,
    );

    const res = await GET(
      makeRequest('b0000000-0000-0000-0000-000000000002', 'user-alice'),
      makeParams('b0000000-0000-0000-0000-000000000002'),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'account_not_found' });
  });

  it('returns 404 when account id does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(
      makeRequest('nonexistent-id'),
      makeParams('nonexistent-id'),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'account_not_found' });
  });
});
