import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const body = await request.json().catch(() => null);
  const { sender_account_id, receiver_account_id, amount } = body ?? {};

  if (!sender_account_id || !receiver_account_id || amount === undefined) {
    return Response.json({ error: 'missing_required_fields' }, { status: 400 });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return Response.json({ error: 'invalid_amount' }, { status: 400 });
  }

  // Verify sender account belongs to the authenticated user
  const { data: senderAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', sender_account_id)
    .eq('user_id', userId)
    .single();

  if (!senderAccount) {
    return Response.json({ error: 'sender_account_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase.rpc('transfer_funds', {
    p_sender_account_id: sender_account_id,
    p_receiver_account_id: receiver_account_id,
    p_amount: amount,
    p_user_id: userId,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes('insufficient_funds')) {
      return Response.json({ error: 'insufficient_funds' }, { status: 422 });
    }
    if (msg.includes('account_not_found_or_inactive')) {
      return Response.json({ error: 'receiver_account_not_found' }, { status: 404 });
    }
    if (msg.includes('self_transfer_not_allowed')) {
      return Response.json({ error: 'self_transfer_not_allowed' }, { status: 422 });
    }
    if (msg.includes('invalid_amount')) {
      return Response.json({ error: 'invalid_amount' }, { status: 400 });
    }
    return Response.json({ error: 'transfer_failed' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
