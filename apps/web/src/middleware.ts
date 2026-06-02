import { type NextRequest, NextResponse } from 'next/server';
import { verifySupabaseToken } from '@/lib/auth';

const PUBLIC_PREFIXES = ['/api/auth/', '/api/health'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

function addCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Respond to CORS preflight for all API routes
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return addCors(NextResponse.next());
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return addCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }));
  }

  try {
    const payload = await verifySupabaseToken(token);

    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.sub);
    headers.set('x-user-role', payload.app_metadata?.role ?? 'client');

    return addCors(NextResponse.next({ request: { headers } }));
  } catch {
    return addCors(NextResponse.json({ error: 'invalid_token' }, { status: 401 }));
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
