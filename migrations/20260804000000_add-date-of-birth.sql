-- Replace collected age with an explicit date of birth.
-- Keep age temporarily so existing data remains recoverable.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Existing ages cannot be converted to an exact birthday safely.
-- Ask existing clients for the real value on their next client visit.
UPDATE public.user_profiles
SET is_profile_completed = false
WHERE role = 'client'
  AND date_of_birth IS NULL
  AND is_profile_completed = true;
