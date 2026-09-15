"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { citiesForProvince, ECUADOR_PROVINCES } from "@/lib/ecuador";
import type { BillingAddress } from "@/types/database";

export async function addBillingAddressAction(formData: FormData): Promise<{ address?: BillingAddress; error?: { message: string } }> {
  const client = createServerClient({ cookies: await cookies() });
  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user) return { error: { message: "Sesión no válida. Inicia sesión para continuar." } };

  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const street = String(formData.get("street") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();

  if (!street || street.length > 250) return { error: { message: "Ingresa la dirección de la calle (máximo 250 caracteres)." } };
  if (!ECUADOR_PROVINCES.includes(province as (typeof ECUADOR_PROVINCES)[number]) || !citiesForProvince(province).includes(city)) {
    return { error: { message: "Selecciona una provincia y ciudad de Ecuador." } };
  }
  if (!/^\d{6}$/.test(postcode)) return { error: { message: "Ingresa un código postal de 6 dígitos." } };

  const { data, error } = await client.database
    .from("billing_addresses")
    .insert([{ user_id: userData.user.id, label: label || null, street, province, city, postcode }])
    .select("id, user_id, label, street, province, city, postcode, created_at")
    .single();

  if (error || !data) return { error: { message: error?.message ?? "No se pudo guardar la dirección." } };
  return { address: data as BillingAddress };
}