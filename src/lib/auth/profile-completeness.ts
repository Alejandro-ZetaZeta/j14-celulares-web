// Shared, runtime-safe helpers to detect which required profile fields are
// missing. Imported by both server-side guards (roles.ts) and the edge proxy
// (proxy.ts), so this module must NOT import Node-only or `next/*` APIs.

export const REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "cedula",
  "phone",
  "date_of_birth",
  "address",
  "province",
  "city",
  "postcode",
] as const;

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number];

export const PROFILE_FIELD_LABELS: Record<RequiredProfileField, string> = {
  full_name: "Nombre completo",
  cedula: "Cédula",
  phone: "Teléfono",
  date_of_birth: "Fecha de nacimiento",
  address: "Dirección",
  province: "Provincia",
  city: "Ciudad",
  postcode: "Código postal",
};

export type ProfileCompletenessInput = {
  full_name?: string | null;
  cedula?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  postcode?: string | null;
};

export function getMissingProfileFields(
  profile: ProfileCompletenessInput | null | undefined,
): RequiredProfileField[] {
  if (!profile) return [...REQUIRED_PROFILE_FIELDS];

  const missing: RequiredProfileField[] = [];
  if (!profile.full_name?.trim()) missing.push("full_name");
  if (!/^\d{10}$/.test(profile.cedula ?? "")) missing.push("cedula");
  if (!profile.phone?.trim()) missing.push("phone");
  if (!profile.date_of_birth) missing.push("date_of_birth");
  if (!profile.address?.trim()) missing.push("address");
  if (!profile.province?.trim()) missing.push("province");
  if (!profile.city?.trim()) missing.push("city");
  if (!/^\d{6}$/.test(profile.postcode ?? "")) missing.push("postcode");
  return missing;
}
