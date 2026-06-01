-- Supabase Auth sets app_metadata (including our custom `role`) in a subsequent
-- UPDATE after the initial INSERT. The INSERT trigger fires too early and sees
-- an incomplete raw_app_meta_data. This trigger catches that UPDATE and keeps
-- public.users.role in sync.

CREATE OR REPLACE FUNCTION public.handle_auth_user_app_metadata_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_app_meta_data->>'role') IS NOT NULL
     AND (NEW.raw_app_meta_data->>'role') <> (OLD.raw_app_meta_data->>'role') THEN
    UPDATE public.users
    SET role = NEW.raw_app_meta_data->>'role'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_app_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_app_metadata_updated
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_app_metadata_update();
