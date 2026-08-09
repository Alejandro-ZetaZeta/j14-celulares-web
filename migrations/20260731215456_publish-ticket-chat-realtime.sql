-- Publish each new chat row to its ticket-scoped Realtime channel.
CREATE OR REPLACE FUNCTION public.publish_ticket_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM realtime.publish(
    'ticket:' || NEW.ticket_id::text,
    'message_created',
    jsonb_build_object(
      'id', NEW.id,
      'ticket_id', NEW.ticket_id,
      'sender_id', NEW.sender_id,
      'sender_role', NEW.sender_role,
      'message', NEW.message,
      'is_read', NEW.is_read,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_message_realtime_trigger ON public.ticket_messages;
CREATE TRIGGER ticket_message_realtime_trigger
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.publish_ticket_message();
