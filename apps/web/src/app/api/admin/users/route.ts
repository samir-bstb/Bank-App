import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, failed_attempts, is_blocked, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'fetch_failed' }, { status: 500 });
  }

  return Response.json({ users: data });
}
