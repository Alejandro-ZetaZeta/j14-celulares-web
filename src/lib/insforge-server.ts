import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { requireAdmin, requireAdminOrTechnician } from "@/lib/auth/roles";

/**
 * User-scoped server client.
 * Uses the logged-in user's access token so RLS policies are enforced.
 * Use this for admin/server actions that must respect app roles.
 */
export async function createInsforgeServerClient() {
  return createServerClient({ cookies: await cookies() });
}

export async function getAdminDatabase() {
  await requireAdmin();
  return (await createInsforgeServerClient()).database;
}

export async function getServiceDatabase() {
  await requireAdminOrTechnician();
  return (await createInsforgeServerClient()).database;
}
