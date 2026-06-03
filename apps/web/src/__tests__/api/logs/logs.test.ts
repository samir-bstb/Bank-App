import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { GET } from '@/app/api/logs/route';
import { supabase } from '@/lib/supabase';

const ALICE_LOGS = [
  {
    id: 'log-001',
    user_id: 'user-alice',
    event_type: 'login_success',
    description: 'User alice logged in',
    created_at: '2026-01-01T00:00:00Z',
  },
];

function makeRequest(userId: string, role: string, search?: string) {
  const url = search
    ? `http://localhost:3000/api/logs?${search}`
    : 'http://localhost:3000/api/logs';
  return new NextRequest(url, {
    headers: { 'x-user-id': userId, 'x-user-role': role },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/logs', () => {
  it('returns 200 with own logs for a client user', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_LOGS, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest('user-alice', 'client'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs: ALICE_LOGS });
  });

  it('returns 200 with all logs for an admin user (no filter)', async () => {
    const allLogs = [
      ...ALICE_LOGS,
      { id: 'log-002', user_id: 'user-bob', event_type: 'login_success' },
    ];
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: allLogs, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest('user-admin', 'admin'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs: allLogs });
  });

  it('returns 200 filtered by user_id when admin passes user_id query param', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: ALICE_LOGS, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest('user-admin', 'admin', 'user_id=user-alice'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs: ALICE_LOGS });
  });

  it('returns 500 when database query fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'DB error' } }) as ReturnType<
        typeof supabase.from
      >,
    );

    const res = await GET(makeRequest('user-alice', 'client'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'failed_to_fetch_logs' });
  });
});
