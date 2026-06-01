import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get('x-user-id')!;
  const { id } = await params;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return Response.json({ error: 'account_not_found' }, { status: 404 });
  }

  return Response.json({ account: data });
}
