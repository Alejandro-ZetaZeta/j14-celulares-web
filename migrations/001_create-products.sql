-- ============================================================
-- Migration 001: Products, Variants, and Phone Serials (IMEI)
-- ============================================================

-- Product type enum
CREATE TYPE product_type AS ENUM ('android', 'sealed_iphone', 'open_box_iphone');

-- Products table (base model catalog)
CREATE TABLE products (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand      TEXT         NOT NULL,
  model      TEXT         NOT NULL,
  type       product_type NOT NULL,
  image_url  TEXT,                        -- Optional; InsForge Storage URL
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Product variants table (commercial attributes + aggregate stock counter)
CREATE TABLE product_variants (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  capacity          TEXT         NOT NULL,
  color             TEXT         NOT NULL,
  price             NUMERIC(10,2) NOT NULL,
  stock             INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  battery_condition INTEGER      CHECK (battery_condition BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- Phone serials table (one row per physical device — internal/admin only)
CREATE TABLE phone_serials (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID    NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  imei       TEXT    UNIQUE NOT NULL,
  is_sold    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_serials  ENABLE ROW LEVEL SECURITY;

-- Public: read all products (image, brand, model visible to catalog)
CREATE POLICY "Public read products"
  ON products FOR SELECT USING (true);

-- Public: read only variants with available stock (stock > 0 filter)
CREATE POLICY "Public read variants with stock"
  ON product_variants FOR SELECT USING (stock > 0);

-- phone_serials: no public access whatsoever (IMEI is internal)
-- Admin (service_role) full access on all three tables
CREATE POLICY "Admin full access products"
  ON products FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access variants"
  ON product_variants FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access serials"
  ON phone_serials FOR ALL USING (auth.role() = 'service_role');
