-- ============================================================
-- Migration 006: Catalog collections and featured products
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER NOT NULL DEFAULT 100;

CREATE TABLE IF NOT EXISTS catalog_collections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  description   TEXT,
  match_type    TEXT NOT NULL CHECK (match_type IN ('all', 'product_type', 'brand_eq', 'model_contains')),
  match_value   TEXT,
  show_as_chip  BOOLEAN NOT NULL DEFAULT true,
  show_on_home  BOOLEAN NOT NULL DEFAULT false,
  pin_order     INTEGER NOT NULL DEFAULT 100,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalog_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active catalog collections" ON catalog_collections;
CREATE POLICY "Public read active catalog collections"
  ON catalog_collections FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access catalog collections" ON catalog_collections;
CREATE POLICY "Admin full access catalog collections"
  ON catalog_collections FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS catalog_collections_chip_order_idx
  ON catalog_collections (is_active, show_as_chip, pin_order);

INSERT INTO catalog_collections (slug, label, description, match_type, match_value, pin_order, show_on_home)
VALUES
  ('android', 'Android', 'Equipos Android disponibles', 'product_type', 'android', 5, true),
  ('sellados', 'Sellados', 'Equipos nuevos en caja original', 'product_type', 'sealed_iphone', 10, true),
  ('open-box', 'Open Box', 'Equipos revisados con condición de batería', 'product_type', 'open_box_iphone', 20, true),
  ('apple-iphone', 'iPhone', 'Modelos iPhone disponibles', 'model_contains', 'iphone', 30),
  ('apple-ipad', 'iPad', 'Tablets Apple disponibles', 'model_contains', 'ipad', 40),
  ('apple-watch', 'Apple Watch', 'Relojes Apple disponibles', 'model_contains', 'watch', 50),
  ('galaxy-s', 'Galaxy S', 'La gama premium de Samsung', 'model_contains', 'galaxy s', 60),
  ('galaxy-a', 'Galaxy A', 'La gama Galaxy A de Samsung', 'model_contains', 'galaxy a', 70),
  ('redmi', 'Redmi', 'Equipos Redmi disponibles', 'model_contains', 'redmi', 80),
  ('moto', 'Moto', 'Equipos Motorola disponibles', 'model_contains', 'moto', 90)
ON CONFLICT (slug) DO NOTHING;
