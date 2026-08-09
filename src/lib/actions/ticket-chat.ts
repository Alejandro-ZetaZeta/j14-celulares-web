"use server";

import { createInsforgeServerClient } from "@/lib/insforge-server";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import type { TicketMessage } from "@/types/database";

async function getSessionContext() {
  const client = await createInsforgeServerClient();
  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  const profile = await getCurrentUserProfile();
  if (userError || !userData?.user || !profile) throw new Error("Sesión no válida.");
  return { client, user: userData.user, profile };
}

async function getTicketOwner(client: Awaited<ReturnType<typeof createInsforgeServerClient>>, ticketId: string) {
  const { data, error } = await client.database
    .from("technical_service")
    .select("id, user_id")
    .eq("id", ticketId)
    .single();
  if (error || !data) throw new Error("Ticket no encontrado.");
  return data as { id: string; user_id: string | null };
}

export async function getTicketMessages(ticketId: string) {
  const { client } = await getSessionContext();
  const { data, error } = await client.database
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as TicketMessage[];
}

export async function sendTicketMessage(ticketId: string, message: string) {
  const text = message.trim();
  if (!text || text.length > 2000) throw new Error("Mensaje inválido.");
  const { client, user, profile } = await getSessionContext();
  const ticket = await getTicketOwner(client, ticketId);

  if (profile.role === "client" && ticket.user_id !== user.id) {
    throw new Error("No puedes escribir en este ticket.");
  }

  if (profile.role !== "client") {
    const { data: existingMessages, error: messagesError } = await client.database
      .from("ticket_messages")
      .select("sender_id, sender_role")
      .eq("ticket_id", ticketId)
      .in("sender_role", ["admin", "technician"])
      .order("created_at", { ascending: true });
    if (messagesError) throw new Error(messagesError.message);

    const representative = (existingMessages as Array<{ sender_id: string; sender_role: string }>)[0];
    if (representative && (representative.sender_id !== user.id || representative.sender_role !== profile.role)) {
      throw new Error("Este chat ya está asignado a otro representante.");
    }
  }

  const { data, error } = await client.database
    .from("ticket_messages")
    .insert([{
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: profile.role,
      message: text,
    }])
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as TicketMessage;
}

export async function clearTicketChat(ticketId: string) {
  const { client, profile } = await getSessionContext();
  if (profile.role !== "admin") throw new Error("Solo un administrador puede limpiar el chat.");
  await getTicketOwner(client, ticketId);

  const { error } = await client.database
    .from("ticket_messages")
    .delete()
    .eq("ticket_id", ticketId);
  if (error) throw new Error(error.message);
}

export async function markTicketMessagesRead(ticketId: string) {
  const { client, user, profile } = await getSessionContext();
  const query = client.database
    .from("ticket_messages")
    .update({ is_read: true })
    .eq("ticket_id", ticketId)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  const { error } = profile.role === "client"
    ? await query
    : await query;
  if (error) throw new Error(error.message);
}

export async function getUnreadTicketMessageCounts(ticketIds: string[]) {
  if (!ticketIds.length) return {} as Record<string, number>;
  const { client, user, profile } = await getSessionContext();
  let query = client.database
    .from("ticket_messages")
    .select("ticket_id")
    .in("ticket_id", ticketIds)
    .eq("is_read", false)
    .neq("sender_id", user.id);
  if (profile.role === "client") query = query.eq("sender_role", "technician");
  else query = query.eq("sender_role", "client");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Array<{ ticket_id: string }>).reduce<Record<string, number>>((counts, row) => {
    counts[row.ticket_id] = (counts[row.ticket_id] ?? 0) + 1;
    return counts;
  }, {});
}
