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
  ('hero_content', '{"eyebrow":{"text":"Catálogo actualizado","visible":true},"headline":{"text":"Tu próximo smartphone, aquí.","visible":true},"description":{"text":"Android e iPhone — sellados y Open Box — con stock en tiempo real y servicio técnico transparente.","visible":true},"primaryButton":{"text":"Ver Catálogo","href":"/catalogo","visible":true},"secondaryButton":{"text":"Consultar mi Reparación","href":"/servicio-tecnico","visible":true}}'),
  ('how_it_works', '[{"id":"deliver","title":"Entrega tu equipo","description":"Trae tu dispositivo a nuestro local. El técnico lo ingresa al sistema y te entregamos un número de ticket único.","visible":true},{"id":"track","title":"Seguimiento en tiempo real","description":"Ingresa tu número de ticket aquí y ve el estado actualizado por el técnico en cada etapa.","visible":true},{"id":"collect","title":"Recoge tu equipo","description":"Cuando el estado cambie a \\"Listo para Entrega\\", visítanos para recoger tu dispositivo reparado.","visible":true}]')
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
