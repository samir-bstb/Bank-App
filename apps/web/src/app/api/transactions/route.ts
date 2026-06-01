import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get('account_id');

  if (!accountId) {
    return Response.json({ error: 'account_id_required' }, { status: 400 });
  }

  // Verify the account belongs to the authenticated user
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (!account) {
    return Response.json({ error: 'account_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`sender_account_id.eq.${accountId},receiver_account_id.eq.${accountId}`)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'failed_to_fetch_transactions' }, { status: 500 });
  }

  return Response.json({ transactions: data });
}
