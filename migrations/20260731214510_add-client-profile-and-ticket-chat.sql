-- ============================================================
-- Client profiles, ticket ownership, and ticket chat
-- ============================================================

-- Keep existing internal role values: admin, technician, client.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS cedula TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_cedula_digits_check'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_cedula_digits_check
      CHECK (cedula IS NULL OR cedula ~ '^[0-9]+$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_age_adult_check'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_age_adult_check
      CHECK (age IS NULL OR age >= 18);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_cedula_idx
  ON public.user_profiles (cedula)
  WHERE cedula IS NOT NULL;

ALTER TABLE public.technical_service
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS technical_service_user_id_idx
  ON public.technical_service (user_id);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL
    REFERENCES public.technical_service(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role user_role NOT NULL,
  message TEXT NOT NULL CHECK (length(btrim(message)) > 0),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx
  ON public.ticket_messages (ticket_id, created_at);

CREATE INDEX IF NOT EXISTS ticket_messages_unread_idx
  ON public.ticket_messages (ticket_id, is_read)
  WHERE is_read = false;

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Existing policy exposed every ticket to anonymous table reads. Public lookup
-- now goes through the exact-code function below instead.
DROP POLICY IF EXISTS "Public read tickets" ON public.technical_service;
DROP POLICY IF EXISTS "Admin full access tickets" ON public.technical_service;
DROP POLICY IF EXISTS "Admin and technician manage tickets" ON public.technical_service;

CREATE POLICY "Client read own tickets"
  ON public.technical_service
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admin and technician manage tickets"
  ON public.technical_service
  FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'technician'))
  WITH CHECK (public.current_user_role() IN ('admin', 'technician'));

-- Safe public projection for the legacy ticket-code lookup flow.
CREATE OR REPLACE FUNCTION public.lookup_ticket_by_code(p_ticket_id TEXT)
RETURNS TABLE (
  id UUID,
  ticket_id TEXT,
  client_name TEXT,
  client_contact TEXT,
  device TEXT,
  status service_status,
  progressing BOOLEAN,
  current_details TEXT,
  entry_date TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT
    t.id,
    t.ticket_id,
    t.client_name,
    t.client_contact,
    t.device,
    t.status,
    t.progressing,
    t.current_details,
    t.entry_date
  FROM public.technical_service AS t
  WHERE t.ticket_id = upper(btrim(p_ticket_id))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_ticket_by_code(TEXT)
  TO anon, authenticated;
REVOKE SELECT ON public.technical_service FROM anon;
GRANT SELECT ON public.technical_service TO authenticated;

-- Technicians need client identity data when working tickets. Admin retains
-- full profile access; clients keep their existing own-profile policies.
DROP POLICY IF EXISTS "Admin full access profiles" ON public.user_profiles;

CREATE POLICY "Admin full access profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Technician read client profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND role = 'client'
  );

DROP POLICY IF EXISTS "Client read own tickets messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Client send ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin and technician read ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin and technician send ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Client mark own ticket messages read" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin and technician mark ticket messages read" ON public.ticket_messages;

CREATE POLICY "Client read own tickets messages"
  ON public.ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.technical_service AS t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admin and technician read ticket messages"
  ON public.ticket_messages
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'technician'));

CREATE POLICY "Client send ticket messages"
  ON public.ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND sender_role = 'client'
    AND public.current_user_role() = 'client'
    AND EXISTS (
      SELECT 1
      FROM public.technical_service AS t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admin and technician send ticket messages"
  ON public.ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND sender_role = public.current_user_role()
    AND public.current_user_role() IN ('admin', 'technician')
  );

CREATE POLICY "Client mark own ticket messages read"
  ON public.ticket_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.technical_service AS t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.technical_service AS t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admin and technician mark ticket messages read"
  ON public.ticket_messages
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'technician'))
  WITH CHECK (public.current_user_role() IN ('admin', 'technician'));

GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
REVOKE UPDATE ON public.ticket_messages FROM anon, authenticated;
GRANT UPDATE (is_read) ON public.ticket_messages TO authenticated;

-- Keep the existing publication and add chat inserts idempotently.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'insforge_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'insforge_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'ticket_messages'
  ) THEN
    ALTER PUBLICATION insforge_realtime ADD TABLE public.ticket_messages;
  END IF;
END;
$$;
