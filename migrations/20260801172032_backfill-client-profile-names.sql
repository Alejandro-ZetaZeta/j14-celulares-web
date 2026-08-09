-- Keep profile identity fields synchronized with InsForge auth metadata.
UPDATE public.user_profiles AS profile
SET full_name = NULLIF(BTRIM(auth_user.profile->>'name'), '')
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND NULLIF(BTRIM(auth_user.profile->>'name'), '') IS NOT NULL
  AND NULLIF(BTRIM(profile.full_name), '') IS NULL;

CREATE INDEX IF NOT EXISTS user_profiles_role_idx
  ON public.user_profiles (role);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'client',
    NULLIF(BTRIM(NEW.profile->>'name'), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(
    NULLIF(BTRIM(public.user_profiles.full_name), ''),
    EXCLUDED.full_name
  );
  RETURN NEW;
END;
$$;
