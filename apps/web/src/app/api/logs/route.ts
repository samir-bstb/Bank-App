import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const userRole = request.headers.get('x-user-role');
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (userRole === 'admin') { // only 'admin' role can see all logs
    const targetUserId = searchParams.get('user_id');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: 'failed_to_fetch_logs' }, { status: 500 });
  }

  return Response.json({ logs: data });
}
