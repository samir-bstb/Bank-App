-- Remove seed rows that used hardcoded UUIDs that don't correspond to
-- any real auth.users entry. From now on, users are created via the
-- Admin API and the on_auth_user_created trigger syncs them to public.users.

DELETE FROM accounts
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003'
);

DELETE FROM logs
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003'
);

DELETE FROM users
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003'
);
