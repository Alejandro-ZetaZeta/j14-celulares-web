-- ============================================================
-- Migration 005: Installments / Credit Card Rates
-- ============================================================

-- Per-product financing visibility toggle
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allows_installments BOOLEAN NOT NULL DEFAULT true;

-- Global credit card installment tiers (months + pre-calculated bank multiplier)
CREATE TABLE IF NOT EXISTS credit_card_rates (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  months              INT           NOT NULL UNIQUE,
  interest_multiplier NUMERIC(6,3)  NOT NULL CHECK (interest_multiplier >= 1),
  active              BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE credit_card_rates ENABLE ROW LEVEL SECURITY;

-- Public: only active rates are visible on the customer catalog
DROP POLICY IF EXISTS "Public read active credit card rates" ON credit_card_rates;
CREATE POLICY "Public read active credit card rates"
  ON credit_card_rates FOR SELECT USING (active = true);

-- Admin (service_role) full access
DROP POLICY IF EXISTS "Admin full access credit card rates" ON credit_card_rates;
CREATE POLICY "Admin full access credit card rates"
  ON credit_card_rates FOR ALL USING (auth.role() = 'service_role');

-- Seed standard retail tiers; update multipliers if they already exist
INSERT INTO credit_card_rates (months, interest_multiplier)
VALUES
  (3,  1.035),
  (6,  1.065),
  (9,  1.095),
  (12, 1.135),
  (18, 1.185),
  (24, 1.250)
ON CONFLICT (months)
DO UPDATE SET interest_multiplier = EXCLUDED.interest_multiplier;
