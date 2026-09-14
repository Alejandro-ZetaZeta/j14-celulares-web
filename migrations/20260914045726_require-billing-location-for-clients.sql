-- Clients who completed their profile before province/city/postcode existed
-- must complete it again so Dataweb production billing fields are collected.
UPDATE public.user_profiles
SET is_profile_completed = false
WHERE role = 'client'
  AND is_profile_completed = true
  AND (province IS NULL OR city IS NULL OR postcode IS NULL);