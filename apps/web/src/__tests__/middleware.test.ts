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
  describe('CORS preflight (OPTIONS)', () => {
    it('returns 204 with CORS headers for any API route', async () => {
      const req = new NextRequest('http://localhost:3000/api/accounts', { method: 'OPTIONS' });
      const res = await middleware(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    });

    it('returns 204 for preflight on public routes too', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', { method: 'OPTIONS' });
      const res = await middleware(req);
      expect(res.status).toBe(204);
    });
  });

  describe('public routes (no auth required)', () => {
    it('passes through /api/health with CORS headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/health');
      const res = await middleware(req);
      expect(res.status).not.toBe(401);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('passes through /api/auth/login with CORS headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST' });
      const res = await middleware(req);
      expect(res.status).not.toBe(401);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('protected routes', () => {
    it('returns 401 unauthorized when Authorization header is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/accounts');
      const res = await middleware(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'unauthorized' });
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
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
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('passes through with valid token, sets user headers, and includes CORS headers', async () => {
      vi.mocked(verifySupabaseToken).mockResolvedValue(VALID_PAYLOAD as never);
      const req = new NextRequest('http://localhost:3000/api/accounts', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(verifySupabaseToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
