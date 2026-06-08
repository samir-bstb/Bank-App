import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get('x-user-role') !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, role, failed_attempts, is_blocked, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !user) {
    return Response.json({ error: 'user_not_found' }, { status: 404 });
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id, account_number, balance, is_active')
    .eq('user_id', id)
    .maybeSingle();

  return Response.json({ user: { ...user, account: account ?? null } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get('x-user-role') !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body?.is_blocked !== 'boolean') {
    return Response.json({ error: 'is_blocked_required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { is_blocked: body.is_blocked };
  if (!body.is_blocked) {
    updates.failed_attempts = 0;
  }

  const { error } = await supabase.from('users').update(updates).eq('id', id);

  if (error) {
    return Response.json({ error: 'update_failed' }, { status: 500 });
  }

  return Response.json({ success: true });
}
