-- Additive Dataweb integration. Existing PagoPlux columns remain untouched.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'pagoplux',
  ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_response_payload JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_provider_transaction_uidx
  ON public.orders(payment_provider, payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.dataweb_payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_transaction_id TEXT NOT NULL UNIQUE,
  checkout_id TEXT UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PROCESSING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  transaction_id TEXT,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dataweb_attempts_user_id_idx
  ON public.dataweb_payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS dataweb_attempts_transaction_id_idx
  ON public.dataweb_payment_attempts(transaction_id);

ALTER TABLE public.dataweb_payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own Dataweb attempts" ON public.dataweb_payment_attempts;
CREATE POLICY "Users can read own Dataweb attempts"
  ON public.dataweb_payment_attempts FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Rollback (run manually if emergency rollback is required):
-- DROP TABLE IF EXISTS public.dataweb_payment_attempts;
-- DROP INDEX IF EXISTS public.orders_payment_provider_transaction_uidx;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_response_payload, DROP COLUMN IF EXISTS payment_transaction_id, DROP COLUMN IF EXISTS payment_provider;
