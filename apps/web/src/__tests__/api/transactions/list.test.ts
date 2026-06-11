import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { GET } from '@/app/api/transactions/route';
import { supabase } from '@/lib/supabase';

const ACCOUNT_ID = 'b0000000-0000-0000-0000-000000000001';

const TRANSACTIONS = [
  {
    id: 'tx-001',
    sender_account_id: ACCOUNT_ID,
    receiver_account_id: 'b0000000-0000-0000-0000-000000000002',
    amount: 100.0,
    status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
  },
];

function makeRequest(params?: string, userId = 'user-alice') {
  const url = params
    ? `http://localhost:3000/api/transactions?${params}`
    : 'http://localhost:3000/api/transactions';
  return new NextRequest(url, { headers: { 'x-user-id': userId } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/transactions', () => {
  it('returns 400 when account_id query param is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'account_id_required' });
  });

  it('returns 404 when account does not belong to the user', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest(`account_id=${ACCOUNT_ID}`, 'other-user'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'account_not_found' });
  });

  it('returns 200 with transaction history for own account', async () => {
    // First from() call: verify account ownership → returns account
    // Second from() call: fetch transactions → returns list
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({ data: { id: ACCOUNT_ID }, error: null }) as ReturnType<typeof supabase.from>,
      )
      .mockReturnValueOnce(
        makeChain({ data: TRANSACTIONS, error: null }) as ReturnType<typeof supabase.from>,
      );

    const res = await GET(makeRequest(`account_id=${ACCOUNT_ID}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactions: TRANSACTIONS });
  });

  it('returns 200 with empty array when no transactions exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({ data: { id: ACCOUNT_ID }, error: null }) as ReturnType<typeof supabase.from>,
      )
      .mockReturnValueOnce(
        makeChain({ data: [], error: null }) as ReturnType<typeof supabase.from>,
      );

    const res = await GET(makeRequest(`account_id=${ACCOUNT_ID}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactions: [] });
  });
});
