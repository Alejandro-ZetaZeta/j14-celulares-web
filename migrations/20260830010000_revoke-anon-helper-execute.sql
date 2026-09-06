-- ============================================================
-- Advisor remediation #2: tighten helper-function EXECUTE
-- ============================================================
-- can_access_ticket_channel() and current_user_role() are SECURITY
-- DEFINER helpers used by RLS policies / realtime (realtime.channels
-- policy and authenticated-role policies). They were granted EXECUTE
-- to PUBLIC, making them callable by the anon role, which never needs
-- them (realtime subscription and all referencing policies run as
-- authenticated). Revoke PUBLIC (drops anon) and re-grant to
-- authenticated + project_admin explicitly.

REVOKE EXECUTE ON FUNCTION public.can_access_ticket_channel(channel TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_ticket_channel(channel TEXT) TO authenticated, project_admin;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, project_admin;

-- lookup_ticket_by_code() intentionally stays callable by anon and
-- authenticated (public ticket-code lookup flow) — not touched.