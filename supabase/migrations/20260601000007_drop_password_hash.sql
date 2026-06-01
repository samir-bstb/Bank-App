-- password_hash in public.users is redundant now that Supabase Auth owns
-- credential storage. Passwords are verified by auth.signInWithPassword();
-- public.users only holds the profile fields the app needs.

ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Update the sync trigger so it no longer references that column.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, role, failed_attempts, is_blocked)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'client'),
    0,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
