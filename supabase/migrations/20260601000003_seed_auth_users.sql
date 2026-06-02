-- Create Supabase Auth entries for the seed test users.
-- Uses the same fixed UUIDs as public.users so both tables share the same id.
-- The on_auth_user_created trigger will fire but ON CONFLICT DO NOTHING
-- handles the already-existing public.users rows gracefully.
--
-- Pre-computed bcrypt hashes (rounds=10, $2b$ — compatible with Go's bcrypt):
--   admin  → Admin1234!
--   alice  → Alice1234!
--   bob    → Bob1234!
--
-- Login format used by the API: username → <username>@bankapp.internal

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@bankapp.internal',
    '$2b$10$mSCwwZ1yvzPQ7Nbo.G.5SuhjhlWQx7KpFR8N5lSoKQkw7oRXf5Qg6',
    NOW(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{"username":"admin"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'alice@bankapp.internal',
    '$2b$10$aTxIk0pcf6a8UEEytOWy9u3/ny1gysaYGpVILvF4rFjsh9BR9ZZ02',
    NOW(),
    '{"provider":"email","providers":["email"],"role":"client"}',
    '{"username":"alice"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'bob@bankapp.internal',
    '$2b$10$8.8FwTAwjfMUPWYWaMtKQ.hLYPV04HratcxojFIcCHt6iuruSlnnS',
    NOW(),
    '{"provider":"email","providers":["email"],"role":"client"}',
    '{"username":"bob"}',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
