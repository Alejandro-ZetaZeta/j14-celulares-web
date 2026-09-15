-- Ecuadorian postal codes are exactly 6 digits.
-- Enforce digits-only, 6-length at the database level.
-- New columns so far are empty; no backfill required.

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_postcode_digits_check,
  ADD CONSTRAINT user_profiles_postcode_digits_check
    CHECK (postcode IS NULL OR postcode ~ '^[0-9]{6}$');

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_postcode_digits_check,
  ADD CONSTRAINT customers_postcode_digits_check
    CHECK (postcode IS NULL OR postcode ~ '^[0-9]{6}$');

ALTER TABLE public.billing_addresses
  DROP CONSTRAINT IF EXISTS billing_addresses_postcode_digits_check,
  ADD CONSTRAINT billing_addresses_postcode_digits_check
    CHECK (postcode IS NULL OR postcode ~ '^[0-9]{6}$');