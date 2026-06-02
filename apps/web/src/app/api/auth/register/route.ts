import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
// Min 8 chars, at least one uppercase, one lowercase, one digit
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { username, password } = body ?? {};

  if (!username || !password) {
    return Response.json({ error: 'username_and_password_required' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return Response.json(
      { error: 'invalid_username', detail: '3–30 chars, only letters, numbers and underscores' },
      { status: 400 },
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    return Response.json(
      { error: 'weak_password', detail: 'Min 8 chars with uppercase, lowercase and a digit' },
      { status: 400 },
    );
  }

  // Check username availability before creating the auth user
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: 'username_taken' }, { status: 409 });
  }

  // Create auth user (service role → skips email confirmation)
  // The on_auth_user_created trigger will sync the profile to public.users
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email: `${username}@bankapp.internal`,
    password,
    email_confirm: true,
    app_metadata: { role: 'client' },
    user_metadata: { username },
  });

  if (createError || !authData.user) {
    return Response.json({ error: 'registration_failed' }, { status: 500 });
  }

  // Sign in to return a usable token immediately
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: `${username}@bankapp.internal`,
    password,
  });

  if (signInError || !sessionData.session) {
    return Response.json({ error: 'registration_succeeded_login_failed' }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('id', authData.user.id)
    .single();

  await supabase.from('logs').insert({
    user_id: authData.user.id,
    event_type: 'register',
    description: `New user registered: ${username}`,
  });

  return Response.json({ token: sessionData.session.access_token, user: profile }, { status: 201 });
}
