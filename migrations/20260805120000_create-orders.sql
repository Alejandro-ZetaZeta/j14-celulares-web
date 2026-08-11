-- Orders created from payment transactions. Legacy PagoPlux fields are retained for compatibility.
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identification TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subtotal_base_0 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal_base_15 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  iva_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  pagoplux_transaction_id TEXT,
  pagoplux_response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_pagoplux_transaction_uidx
  ON orders(pagoplux_transaction_id) WHERE pagoplux_transaction_id IS NOT NULL;

-- Atomic stock reservation used by the payment callback.
CREATE OR REPLACE FUNCTION reserve_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id AND p_quantity > 0 AND stock >= p_quantity
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$$;

CREATE OR REPLACE FUNCTION release_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE product_variants SET stock = stock + p_quantity
    WHERE id = p_variant_id AND p_quantity > 0
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$$;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read own customer record" ON customers;
CREATE POLICY "Customers can read own customer record" ON customers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR auth.role() = 'service_role')));
