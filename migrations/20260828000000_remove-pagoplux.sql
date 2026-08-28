-- Remove legacy PagoPlux orders and schema. Dataweb is the only payment provider.
DELETE FROM public.order_items
WHERE order_id IN (
  SELECT id
  FROM public.orders
  WHERE payment_provider = 'pagoplux'
     OR pagoplux_transaction_id IS NOT NULL
);

DELETE FROM public.orders
WHERE payment_provider = 'pagoplux'
   OR pagoplux_transaction_id IS NOT NULL;

DROP INDEX IF EXISTS public.orders_pagoplux_transaction_uidx;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS pagoplux_transaction_id,
  DROP COLUMN IF EXISTS pagoplux_response_payload;

ALTER TABLE public.orders
  ALTER COLUMN payment_method SET DEFAULT 'Dataweb';
