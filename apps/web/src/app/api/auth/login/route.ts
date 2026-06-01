import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { username, password } = body ?? {};

  if (!username || !password) {
    return Response.json({ error: 'username_and_password_required' }, { status: 400 });
  }

  // Look up the profile first — needed for is_blocked check and failed_attempts tracking
  const { data: profile } = await supabase
    .from('users')
    .select('id, username, role, failed_attempts, is_blocked')
    .eq('username', username)
    .maybeSingle();

  if (!profile) {
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  if (profile.is_blocked) {
    await supabase.from('logs').insert({
      user_id: profile.id,
      event_type: 'login_blocked',
      description: `Login attempt on blocked account: ${username}`,
    });
    return Response.json({ error: 'account_blocked' }, { status: 403 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@bankapp.internal`,
    password,
  });

  if (error || !data.session) {
    const newAttempts = profile.failed_attempts + 1;
    const shouldBlock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await supabase
      .from('users')
      .update({ failed_attempts: newAttempts, is_blocked: shouldBlock })
      .eq('id', profile.id);

    await supabase.from('logs').insert({
      user_id: profile.id,
      event_type: 'login_failed',
      description: `Failed login attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS} for ${username}`,
    });

    if (shouldBlock) {
      return Response.json({ error: 'account_blocked' }, { status: 403 });
    }

    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  // Reset counter on success
  await supabase
    .from('users')
    .update({ failed_attempts: 0 })
    .eq('id', profile.id);

  await supabase.from('logs').insert({
    user_id: profile.id,
    event_type: 'login_success',
    description: `User ${username} logged in`,
  });

  return Response.json({
    token: data.session.access_token,
    user: { id: profile.id, username: profile.username, role: profile.role },
  });
}
