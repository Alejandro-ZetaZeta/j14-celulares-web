CREATE OR REPLACE FUNCTION public.can_access_ticket_channel(channel TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN channel !~ '^ticket:[0-9a-fA-F-]{36}$' THEN false
    WHEN public.current_user_role() IN ('admin', 'technician') THEN true
    WHEN public.current_user_role() = 'client' THEN EXISTS (
      SELECT 1
      FROM public.technical_service AS t
      WHERE t.id = split_part(channel, ':', 2)::uuid
        AND t.user_id = auth.uid()
    )
    ELSE false
  END;
$$;

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('ticket:%', 'Ticket chat channels', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket participants subscribe" ON realtime.channels;
CREATE POLICY "Ticket participants subscribe"
  ON realtime.channels
  FOR SELECT
  TO authenticated
  USING (public.can_access_ticket_channel(realtime.channel_name()));
