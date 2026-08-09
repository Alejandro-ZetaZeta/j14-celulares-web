-- ============================================================
-- Migration 002: Technical Service (Tickets)
-- ============================================================

-- Service status enum
CREATE TYPE service_status AS ENUM ('received', 'under_diagnosis', 'ready_for_delivery');

-- Technical service table
CREATE TABLE technical_service (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       TEXT           UNIQUE NOT NULL,        -- Human-readable, e.g. ST-20260625-001
  client_name     TEXT           NOT NULL,
  client_contact  TEXT           NOT NULL,
  device          TEXT           NOT NULL,
  status          service_status NOT NULL DEFAULT 'received',
  progressing     BOOLEAN        NOT NULL DEFAULT false,  -- true = avanzando, false = detenido
  current_details TEXT           NOT NULL DEFAULT '',
  entry_date      TIMESTAMPTZ    DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE technical_service ENABLE ROW LEVEL SECURITY;

-- Public: anyone can look up a ticket by ticket_id (the customer's lookup flow)
CREATE POLICY "Public read tickets"
  ON technical_service FOR SELECT USING (true);

-- Admin full access (create, update, delete tickets)
CREATE POLICY "Admin full access tickets"
  ON technical_service FOR ALL USING (auth.role() = 'service_role');

-- ── Realtime ─────────────────────────────────────────────────
-- Create the realtime publication (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'insforge_realtime'
  ) THEN
    CREATE PUBLICATION insforge_realtime FOR TABLE technical_service;
  ELSE
    ALTER PUBLICATION insforge_realtime ADD TABLE technical_service;
  END IF;
END;
$$;
