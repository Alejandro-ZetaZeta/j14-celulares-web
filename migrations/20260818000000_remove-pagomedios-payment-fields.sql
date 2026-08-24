ALTER TABLE public.orders
  DROP COLUMN IF EXISTS pagomedios_payment_token,
  DROP COLUMN IF EXISTS pagomedios_response_payload;

DROP INDEX IF EXISTS public.orders_pagomedios_payment_token_uidx;
DROP FUNCTION IF EXISTS public.approve_order_with_stock(UUID);
