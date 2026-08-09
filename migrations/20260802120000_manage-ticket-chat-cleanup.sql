-- Allow administrators to manually remove ticket chat history.
DROP POLICY IF EXISTS "Admin delete ticket messages" ON public.ticket_messages;

CREATE POLICY "Admin delete ticket messages"
  ON public.ticket_messages
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

GRANT DELETE ON public.ticket_messages TO authenticated;
