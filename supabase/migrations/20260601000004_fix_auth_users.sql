-- Remove the seed rows that were inserted directly into auth.users.
-- Direct inserts miss required internal fields (confirmation_token, etc.)
-- and break Supabase Auth. Seed users must be created via the Admin API instead.

DELETE FROM auth.users
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003'
);
