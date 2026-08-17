-- Migration: Add 'delivered' value to service_status ENUM
-- This finalizes the ticket lifecycle: received → under_diagnosis → ready_for_delivery → delivered
-- ALTER TYPE ... ADD VALUE is safe on Postgres 12+ and does not require a table rewrite.
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'delivered' AFTER 'ready_for_delivery';
