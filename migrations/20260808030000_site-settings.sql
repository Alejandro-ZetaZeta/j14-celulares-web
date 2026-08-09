-- Public storefront settings managed by administrators.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value)
VALUES
  ('tax_rate', '15'),
  ('whatsapp_number', '593960507959'),
  ('hero_content', '{"eyebrow":{"text":"Catálogo actualizado","visible":true},"headline":{"text":"Tu próximo smartphone, aquí.","visible":true},"description":{"text":"Android e iPhone — sellados y Open Box — con stock en tiempo real y servicio técnico transparente.","visible":true},"primaryButton":{"text":"Ver Catálogo","href":"/catalogo","visible":true},"secondaryButton":{"text":"Consultar mi Reparación","href":"/servicio-tecnico","visible":true}}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read storefront settings" ON site_settings;
CREATE POLICY "Anyone can read storefront settings"
  ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage storefront settings" ON site_settings;
CREATE POLICY "Admins can manage storefront settings"
  ON site_settings FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
