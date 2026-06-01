-- Sync new Supabase Auth users to public.users.
--
-- When a user registers through supabase.auth.admin.createUser() or signUp(),
-- this trigger copies the minimal profile fields to public.users so the rest
-- of the application can join against it.
--
-- Fields copied from auth.users:
--   id                   → public.users.id
--   encrypted_password   → public.users.password_hash (kept non-null; owned by Auth)
--   raw_app_meta_data->>'role'      → role (set server-side via admin)
--   raw_user_meta_data->>'username' → username (set by the client at sign-up)

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, password_hash, role, failed_attempts, is_blocked)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.encrypted_password,
    COALESCE(NEW.raw_app_meta_data->>'role', 'client'),
    0,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
