-- Promotions, product gifts, and order price snapshots.
CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed', 'gift');

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type promotion_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  min_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promotions_dates_valid CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT promotions_percentage_valid CHECK (promotion_type <> 'percentage' OR discount_value <= 100),
  CONSTRAINT promotions_gift_value_zero CHECK (promotion_type <> 'gift' OR discount_value = 0)
);

CREATE TABLE promotion_products (
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

CREATE TABLE product_gifts (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  gift_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, gift_product_id),
  CONSTRAINT product_gifts_not_self CHECK (product_id <> gift_product_id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_code TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL;

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promotions" ON promotions FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Admins manage promotion products" ON promotion_products FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Admins manage product gifts" ON product_gifts FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Public read product gifts" ON product_gifts FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotion_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_gifts TO authenticated;
GRANT SELECT ON public.product_gifts TO anon;

CREATE OR REPLACE FUNCTION public.increment_promotion_use(p_promotion_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.promotions
    SET used_count = used_count + 1
    WHERE id = p_promotion_id AND (max_uses IS NULL OR used_count < max_uses)
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$$;
