"use server";

import { createInsforgeServerClient } from "@/lib/insforge-server";
import { requireCompletedClient } from "@/lib/auth/roles";
import type { TechnicalService } from "@/types/database";

export async function getClientTickets() {
  const profile = await requireCompletedClient();
  if (profile.role !== "client") return [] as TechnicalService[];
  const client = await createInsforgeServerClient();
  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user) return [] as TechnicalService[];

  const { data, error } = await client.database
    .from("technical_service")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("entry_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as TechnicalService[];
}
