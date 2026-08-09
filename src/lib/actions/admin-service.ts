"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import { requireAdminOrTechnician } from "@/lib/auth/roles";
import type { TechnicalService, TechnicalServiceWithProfile, UserProfile } from "@/types/database";

function generateTicketId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 900 + 100); // 100–999
  return `ST-${date}-${random}`;
}

export async function getAllTickets(filter?: { status?: string }) {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  let query = db
    .from("technical_service")
    .select("*")
    .order("entry_date", { ascending: false });

  if (filter?.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const tickets = data as TechnicalService[];
  const userIds = [...new Set(tickets.flatMap((ticket) => ticket.user_id ? [ticket.user_id] : []))];
  const profiles = userIds.length
    ? await db.from("user_profiles").select("id, full_name, phone, role").in("id", userIds)
    : { data: [], error: null };
  if (profiles.error) throw new Error(profiles.error.message);
  const profileById = new Map((profiles.data as Array<Pick<UserProfile, "id" | "full_name" | "phone" | "role">>).map((profile) => [profile.id, profile]));
  return tickets.map((ticket) => ({ ...ticket, client_profile: ticket.user_id ? profileById.get(ticket.user_id) ?? null : null })) as TechnicalServiceWithProfile[];
}

export async function getClientProfiles(search = "") {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;
  const normalized = search.trim();
  let query = db.from("user_profiles").select("id, full_name, phone, role").eq("role", "client").order("full_name");
  if (normalized) query = query.or(`full_name.ilike.%${normalized}%,phone.ilike.%${normalized}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Array<Pick<UserProfile, "id" | "full_name" | "phone" | "role">>)
    .filter((profile) => profile.role === "client");
}

export async function createTicket(formData: FormData): Promise<TechnicalService> {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  const client_name    = formData.get("client_name") as string;
  const client_contact = formData.get("client_contact") as string;
  const device         = formData.get("device") as string;
  const user_id = String(formData.get("user_id") ?? "").trim() || null;

  if (user_id) {
    const { data: profile, error: profileError } = await db
      .from("user_profiles")
      .select("id")
      .eq("id", user_id)
      .eq("role", "client")
      .single();
    if (profileError || !profile) throw new Error("Cliente no encontrado.");
  }

  const ticket_id = generateTicketId();

  const { data, error } = await db
    .from("technical_service")
    .insert([{
      ticket_id,
      client_name,
      client_contact,
      device,
      status: "received",
      progressing: false,
      current_details: "",
      user_id,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicio-tecnico");
  updateTag(`ticket-${ticket_id}`);
  return data as TechnicalService;
}

export async function updateTicketStatus(
  id: string,
  updates: Partial<Pick<TechnicalService, "status" | "progressing" | "current_details">>
) {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  const { data, error } = await db
    .from("technical_service")
    .update(updates)
    .eq("id", id)
    .select("ticket_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicio-tecnico");
  if (data?.ticket_id) updateTag(`ticket-${data.ticket_id}`);
}

export async function markReadyForDelivery(id: string) {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  const { data, error } = await db
    .from("technical_service")
    .update({ status: "ready_for_delivery", progressing: false })
    .eq("id", id)
    .select("ticket_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicio-tecnico");
  if (data?.ticket_id) updateTag(`ticket-${data.ticket_id}`);
}

export async function deleteTicket(id: string) {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  const { data: row } = await db
    .from("technical_service")
    .select("ticket_id")
    .eq("id", id)
    .single();
  const { error } = await db.from("technical_service").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicio-tecnico");
  if (row?.ticket_id) updateTag(`ticket-${row.ticket_id}`);
}

export async function linkTicketToClient(ticketId: string, userId: string | null) {
  await requireAdminOrTechnician();
  const db = (await createInsforgeServerClient()).database;

  if (userId) {
    const { data: profile, error: profileError } = await db
      .from("user_profiles")
      .select("id, role")
      .eq("id", userId)
      .eq("role", "client")
      .single();
    if (profileError || !profile) throw new Error("Cliente no encontrado.");
  }

  const { data, error } = await db
    .from("technical_service")
    .update({ user_id: userId })
    .eq("id", ticketId)
    .select("ticket_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicio-tecnico");
  if (data?.ticket_id) updateTag(`ticket-${data.ticket_id}`);
}

