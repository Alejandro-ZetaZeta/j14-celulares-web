-- ============================================================
-- Billing address structure: province, city, postcode
-- Required by Dataweb (Datafast/OPPWA) production billing payload.
-- ============================================================

-- User profile: structured billing/contact location
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Customers (order snapshots): same structured fields
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Saved billing addresses: users can create extra addresses
-- without overwriting their profile data.
CREATE TABLE IF NOT EXISTS public.billing_addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT,
  street     TEXT NOT NULL,
  province   TEXT NOT NULL,
  city       TEXT NOT NULL,
  postcode   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_addresses_user_id_idx
  ON public.billing_addresses (user_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.billing_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own billing addresses" ON public.billing_addresses;
CREATE POLICY "Users read own billing addresses"
  ON public.billing_addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own billing addresses" ON public.billing_addresses;
CREATE POLICY "Users insert own billing addresses"
  ON public.billing_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own billing addresses" ON public.billing_addresses;
CREATE POLICY "Users update own billing addresses"
  ON public.billing_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own billing addresses" ON public.billing_addresses;
CREATE POLICY "Users delete own billing addresses"
  ON public.billing_addresses FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access billing addresses" ON public.billing_addresses;
CREATE POLICY "Admin full access billing addresses"
  ON public.billing_addresses FOR ALL
  USING (auth.role() = 'service_role');