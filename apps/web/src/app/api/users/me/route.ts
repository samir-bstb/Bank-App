import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;

  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, created_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return Response.json({ error: 'user_not_found' }, { status: 404 });
  }

  return Response.json({ user: data });
}
