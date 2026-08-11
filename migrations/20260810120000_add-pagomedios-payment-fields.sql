ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pagomedios_payment_token TEXT,
  ADD COLUMN IF NOT EXISTS pagomedios_response_payload JSONB;

ALTER TABLE public.orders
  ALTER COLUMN payment_method SET DEFAULT 'Pagomedios';

CREATE UNIQUE INDEX IF NOT EXISTS orders_pagomedios_payment_token_uidx
  ON public.orders(pagomedios_payment_token)
  WHERE pagomedios_payment_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.approve_order_with_stock(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_status TEXT;
  item RECORD;
BEGIN
  SELECT status INTO order_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF order_status IS NULL OR order_status <> 'PENDING' THEN RETURN FALSE; END IF;

  FOR item IN
    SELECT i.variant_id, i.quantity, p.stock
    FROM public.order_items i
    JOIN public.product_variants p ON p.id = i.variant_id
    WHERE i.order_id = p_order_id
    FOR UPDATE OF p
  LOOP
    IF item.stock < item.quantity THEN RETURN FALSE; END IF;
  END LOOP;

  FOR item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
    UPDATE public.product_variants
    SET stock = stock - item.quantity
    WHERE id = item.variant_id;
  END LOOP;

  UPDATE public.orders SET status = 'APPROVED' WHERE id = p_order_id AND status = 'PENDING';
  RETURN TRUE;
END;
$$;
