-- ============================================================
-- Card tokens: store Datafast registrationIds for One Click Checkout.
-- Users can save card details (tokenized) for faster future payments.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.card_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id  TEXT NOT NULL UNIQUE,
  brand            TEXT,
  last4            TEXT,
  expiry_month     TEXT,
  expiry_year      TEXT,
  holder           TEXT,
  label            TEXT GENERATED ALWAYS AS (
    COALESCE(brand, 'Card') || ' ****' || COALESCE(last4, '????')
  ) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS card_tokens_user_id_idx
  ON public.card_tokens (user_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.card_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own card tokens" ON public.card_tokens;
CREATE POLICY "Users read own card tokens"
  ON public.card_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own card tokens" ON public.card_tokens;
CREATE POLICY "Users delete own card tokens"
  ON public.card_tokens FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access card tokens" ON public.card_tokens;
CREATE POLICY "Service role full access card tokens"
  ON public.card_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Rollback (run manually if emergency rollback is required):
-- DROP TABLE IF EXISTS public.card_tokens;
