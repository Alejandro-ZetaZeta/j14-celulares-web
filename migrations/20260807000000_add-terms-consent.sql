ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

COMMENT ON COLUMN public.user_profiles.terms_accepted_at IS 'Timestamp when client accepted current legal terms';
COMMENT ON COLUMN public.user_profiles.terms_version IS 'Version of legal terms accepted by client';
