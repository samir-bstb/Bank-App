import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeChain } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { GET } from '@/app/api/users/me/route';
import { supabase } from '@/lib/supabase';

function makeRequest(userId = 'user-alice') {
  return new NextRequest('http://localhost:3000/api/users/me', {
    headers: { 'x-user-id': userId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/users/me', () => {
  it('returns 200 with user profile', async () => {
    const userData = {
      id: 'user-alice',
      username: 'alice',
      role: 'client',
      created_at: '2026-01-01T00:00:00Z',
    };
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: userData, error: null }) as ReturnType<typeof supabase.from>,
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: userData });
  });

  it('returns 404 when user is not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'Row not found' } }) as ReturnType<
        typeof supabase.from
      >,
    );

    const res = await GET(makeRequest('nonexistent-id'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'user_not_found' });
  });
});
