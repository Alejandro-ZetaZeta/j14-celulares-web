// Server-only auth guard utilities — do NOT add 'use server' here.
// These are imported directly by server components and layouts.
// The "use server" directive is only for Server Actions (mutations called from client).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@insforge/sdk/ssr";
import type { UserProfile } from "@/types/database";

export type AppRole = "admin" | "technician" | "client";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  technician: "Soporte Técnico",
  client: "Cliente",
};

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const cookieStore = await cookies();
  const client = createServerClient({ cookies: cookieStore });

  const { data: authData, error: authError } = await client.auth.getCurrentUser();
  if (authError || !authData?.user) return null;

  const { data, error } = await client.database
    .from("user_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (error || !data) return null;
  return (data.role as AppRole) ?? null;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const client = createServerClient({ cookies: cookieStore });

  const { data: authData, error: authError } = await client.auth.getCurrentUser();
  if (authError || !authData?.user) return null;

  const { data, error } = await client.database
    .from("user_profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function requireRole(...allowed: AppRole[]): Promise<AppRole> {
  const role = await getCurrentUserRole();
  if (!role || !allowed.includes(role)) {
    redirect("/admin/login");
  }
  return role;
}

export async function requireAdmin(): Promise<"admin"> {
  return requireRole("admin") as Promise<"admin">;
}

export async function requireAdminOrTechnician(): Promise<"admin" | "technician"> {
  return requireRole("admin", "technician") as Promise<"admin" | "technician">;
}

export async function requireClientOrAdmin(): Promise<"client" | "admin"> {
  return requireRole("client", "admin") as Promise<"client" | "admin">;
}

export async function requireCompletedClient(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile || !["client", "admin"].includes(profile.role)) {
    redirect("/cliente/login");
  }
  if (profile.role === "client" && (!profile.is_profile_completed || !profile.date_of_birth)) {
    redirect("/cliente/completar-perfil");
  }
  return profile;
}
