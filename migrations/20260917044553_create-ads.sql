-- ── Ads (Publicidad) ─────────────────────────────────────────
-- Large-format promotional ads shown to visitors as a modal carousel.
-- Supports separate desktop and mobile images, a click-through URL,
-- display ordering, and soft-hiding without permanent deletion.

CREATE TABLE public.ads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  -- Desktop image (wide/horizontal, shown on md+ screens)
  image_url         text        NOT NULL,
  image_key         text        NOT NULL,
  -- Mobile image (tall/vertical, shown on small screens); nullable
  image_mobile_url  text,
  image_mobile_key  text,
  -- Optional click-through URL (absolute or relative path)
  link_url          text,
  display_order     int         NOT NULL DEFAULT 0,
  is_hidden         boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Public visitors can read only visible ads
CREATE POLICY "ads_select_public"
  ON public.ads
  FOR SELECT
  USING (NOT is_hidden);

-- service_role bypasses RLS — admin actions use insforgeAdmin which holds service role key
-- No explicit policy needed for INSERT/UPDATE/DELETE via service role

-- Index for the frontend query (visible ads sorted by display_order)
CREATE INDEX idx_ads_visible_order ON public.ads (display_order ASC)
  WHERE NOT is_hidden;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.ads_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.ads_set_updated_at();
