import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { POST } from '@/app/api/transactions/transfer/route';
import { supabase } from '@/lib/supabase';

const SENDER_ID = 'b0000000-0000-0000-0000-000000000001';
const RECEIVER_ID = 'b0000000-0000-0000-0000-000000000002';
const USER_ID = 'user-alice';

function makeRequest(body: object, userId = USER_ID) {
  return new NextRequest('http://localhost:3000/api/transactions/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify(body),
  });
}

function mockSenderFound() {
  vi.mocked(supabase.from).mockReturnValue(
    makeChain({ data: { id: SENDER_ID }, error: null }) as ReturnType<typeof supabase.from>,
  );
}

function mockSenderNotFound() {
  vi.mocked(supabase.from).mockReturnValue(
    makeChain({ data: null, error: null }) as ReturnType<typeof supabase.from>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/transactions/transfer', () => {
  it('returns 400 when amount is negative', async () => {
    const res = await POST(
      makeRequest({ sender_account_id: SENDER_ID, receiver_account_id: RECEIVER_ID, amount: -100 }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_amount' });
  });

  it('returns 400 when amount is zero', async () => {
    const res = await POST(
      makeRequest({ sender_account_id: SENDER_ID, receiver_account_id: RECEIVER_ID, amount: 0 }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_amount' });
  });

  it('returns 400 when amount is not a number', async () => {
    const res = await POST(
      makeRequest({
        sender_account_id: SENDER_ID,
        receiver_account_id: RECEIVER_ID,
        amount: 'abc',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_amount' });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ sender_account_id: SENDER_ID }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'missing_required_fields' });
  });

  it('returns 404 when sender account does not belong to the user', async () => {
    mockSenderNotFound();
    const res = await POST(
      makeRequest({
        sender_account_id: 'other-user-account',
        receiver_account_id: RECEIVER_ID,
        amount: 100,
      }),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'sender_account_not_found' });
  });

  it('returns 201 on successful transfer', async () => {
    mockSenderFound();
    const rpcResult = { transaction_id: 'tx-001', status: 'completed', amount: 200.0 };
    vi.mocked(supabase.rpc).mockResolvedValue({ data: rpcResult, error: null } as never);

    const res = await POST(
      makeRequest({ sender_account_id: SENDER_ID, receiver_account_id: RECEIVER_ID, amount: 200 }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(rpcResult);
  });

  it('returns 422 on insufficient funds', async () => {
    mockSenderFound();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'insufficient_funds' },
    } as never);

    const res = await POST(
      makeRequest({
        sender_account_id: SENDER_ID,
        receiver_account_id: RECEIVER_ID,
        amount: 9_999_999,
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'insufficient_funds' });
  });

  it('returns 422 on self-transfer', async () => {
    mockSenderFound();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'self_transfer_not_allowed' },
    } as never);

    const res = await POST(
      makeRequest({ sender_account_id: SENDER_ID, receiver_account_id: SENDER_ID, amount: 50 }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'self_transfer_not_allowed' });
  });

  it('returns 404 when receiver account is not found or inactive', async () => {
    mockSenderFound();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'account_not_found_or_inactive' },
    } as never);

    const res = await POST(
      makeRequest({
        sender_account_id: SENDER_ID,
        receiver_account_id: 'inactive-account',
        amount: 100,
      }),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'receiver_account_not_found' });
  });
});
