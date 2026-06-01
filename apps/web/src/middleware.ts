import { type NextRequest, NextResponse } from 'next/server';
import { verifySupabaseToken } from '@/lib/auth';

const PUBLIC_PREFIXES = ['/api/auth/', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifySupabaseToken(token);

    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.sub);
    headers.set('x-user-role', payload.app_metadata?.role ?? 'client');

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
