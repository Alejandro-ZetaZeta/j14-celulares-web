-- Product types are labels, not a closed enum. Existing values remain unchanged.
ALTER TABLE products ALTER COLUMN type TYPE TEXT USING type::text;
DROP TYPE IF EXISTS product_type;

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product images" ON product_images;
CREATE POLICY "Public read product images" ON product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access product images" ON product_images;
CREATE POLICY "Admin full access product images" ON product_images FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS product_images_product_order_idx ON product_images(product_id, display_order, created_at);
