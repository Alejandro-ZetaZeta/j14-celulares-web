-- Convert orders.id from UUID to a short, human-friendly, web-watermarked
-- hex identifier. Format: J14-<10 uppercase hex chars>  (e.g. J14-9F3AB2C1D0)
-- "J14" is the Celulares J14 watermark so a sale id is instantly attributable
-- to this site and far shorter than a UUID.

-- Default generator used for new inserts (id is never passed by app code).
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
BEGIN
  LOOP
    v_id := 'J14-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE id = v_id);
  END LOOP;
  RETURN v_id;
END;
$$;

-- 0) Drop RLS policies that reference orders.id / order_items.order_id.
--    Postgres blocks ALTER TYPE on columns used in a policy definition, so
--    these must be removed before the type change and recreated afterwards.
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can read order items" ON public.order_items;

-- 1) Drop FK so column types can change.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- 2) Backfill existing orders with new ids, derived deterministically from the
--    old uuid + created_at so every old row gets a stable, unique hex id.
ALTER TABLE public.orders ADD COLUMN new_id TEXT;
UPDATE public.orders
   SET new_id = 'J14-' || upper(substr(md5(id::text || ':' || created_at::text), 1, 10));

-- 3) order_items.order_id -> TEXT first (it currently holds old UUID values).
ALTER TABLE public.order_items ALTER COLUMN order_id TYPE TEXT USING order_id::text;

-- 4) Remap order_items to the new order ids.
UPDATE public.order_items oi
   SET order_id = o.new_id
  FROM public.orders o
 WHERE o.id::text = oi.order_id;

-- 5) Promote new_id to the real id (PK).
ALTER TABLE public.orders DROP CONSTRAINT orders_pkey;
ALTER TABLE public.orders DROP COLUMN id;
ALTER TABLE public.orders RENAME COLUMN new_id TO id;
ALTER TABLE public.orders ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT public.generate_order_id();
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

-- 6) Recreate FK + index.
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- 7) Recreate the RLS policies that were dropped in step 0.
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT TO public
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated
  USING (current_user_role() = 'admin'::user_role)
  WITH CHECK (current_user_role() = 'admin'::user_role);
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR auth.role() = 'service_role')
  ));
CREATE POLICY "Admins can read order items" ON public.order_items FOR SELECT TO authenticated
  USING (current_user_role() = 'admin');