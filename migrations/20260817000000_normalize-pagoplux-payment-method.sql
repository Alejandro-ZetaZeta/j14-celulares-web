UPDATE public.orders
SET payment_method = 'PagoPlux'
WHERE payment_method = 'Pagomedios'
  AND pagoplux_transaction_id IS NOT NULL;
