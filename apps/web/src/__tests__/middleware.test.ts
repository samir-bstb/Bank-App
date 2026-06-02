import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  verifySupabaseToken: vi.fn(),
}));

import { middleware } from '@/middleware';
import { verifySupabaseToken } from '@/lib/auth';

const VALID_PAYLOAD = {
  sub: 'user-alice',
  app_metadata: { role: 'client' },
  user_metadata: { username: 'alice' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Auth Middleware', () => {
  describe('public routes (no auth required)', () => {
    it('passes through /api/health', async () => {
      const req = new NextRequest('http://localhost:3000/api/health');
      const res = await middleware(req);
      expect(res.status).not.toBe(401);
    });

    it('passes through /api/auth/login', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST' });
      const res = await middleware(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe('protected routes', () => {
    it('returns 401 unauthorized when Authorization header is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/accounts');
      const res = await middleware(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'unauthorized' });
    });

    it('returns 401 unauthorized when Authorization header has no Bearer prefix', async () => {
      const req = new NextRequest('http://localhost:3000/api/accounts', {
        headers: { Authorization: 'token-without-bearer' },
      });
      const res = await middleware(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'unauthorized' });
    });

    it('returns 401 invalid_token when token verification fails', async () => {
      vi.mocked(verifySupabaseToken).mockRejectedValue(new Error('jwt malformed'));
      const req = new NextRequest('http://localhost:3000/api/accounts', {
        headers: { Authorization: 'Bearer token_invalido' },
      });
      const res = await middleware(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'invalid_token' });
    });

    it('passes through and injects x-user-id with valid token', async () => {
      vi.mocked(verifySupabaseToken).mockResolvedValue(VALID_PAYLOAD as never);
      const req = new NextRequest('http://localhost:3000/api/accounts', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const res = await middleware(req);
      // NextResponse.next() returns status 200 (continue signal)
      expect(res.status).toBe(200);
      expect(verifySupabaseToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
