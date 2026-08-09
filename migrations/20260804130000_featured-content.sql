-- ============================================================
-- Migration 007: Featured product sales copy
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured_eyebrow TEXT,
  ADD COLUMN IF NOT EXISTS featured_headline TEXT,
  ADD COLUMN IF NOT EXISTS featured_description TEXT,
  ADD COLUMN IF NOT EXISTS featured_cta TEXT;
