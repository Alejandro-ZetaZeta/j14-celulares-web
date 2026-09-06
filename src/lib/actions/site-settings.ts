"use server";

import { updateTag, revalidatePath } from "next/cache";
import { createInsforgeServerClient, getAdminDatabase } from "@/lib/insforge-server";
import { DEFAULT_HERO_CONTENT, DEFAULT_HOW_IT_WORKS, DEFAULT_TAX_RATE, DEFAULT_WHATSAPP_NUMBER, type HeroContent, type HowItWorksStep, type SiteSettings } from "@/lib/site-settings";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { requireAdminOrTechnician } from "@/lib/auth/roles";

export async function getSiteSettingsAdmin(): Promise<SiteSettings> {
  const db = await getAdminDatabase();
  const { data, error } = await db.from("site_settings").select("key, value").in("key", ["tax_rate", "whatsapp_number", "hero_content", "how_it_works"]);
  if (error) throw new Error(error.message);

  const values = new Map((data ?? []).map((setting) => [String(setting.key), String(setting.value)]));
  const taxRate = Number(values.get("tax_rate"));
  const whatsappNumber = (values.get("whatsapp_number") ?? DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
  let hero = DEFAULT_HERO_CONTENT;
  try {
    const parsed = JSON.parse(values.get("hero_content") ?? "null") as Partial<HeroContent> | null;
    if (parsed?.eyebrow && parsed.headline && parsed.description && parsed.primaryButton && parsed.secondaryButton) hero = parsed as HeroContent;
  } catch {
    // Keep defaults when old or malformed content exists.
  }
  const howItWorks = parseHowItWorks(values.get("how_it_works"));
  return {
    taxRate: Number.isFinite(taxRate) && taxRate >= 0 && taxRate <= 100 ? taxRate : DEFAULT_TAX_RATE,
    whatsappNumber: whatsappNumber || DEFAULT_WHATSAPP_NUMBER,
    hero,
    howItWorks,
  };
}

export async function getServiceStepsForEditor(): Promise<HowItWorksStep[]> {
  await requireAdminOrTechnician();
  const { data, error } = await (await createInsforgeServerClient()).database.from("site_settings").select("value").eq("key", "how_it_works").maybeSingle();
  return error ? DEFAULT_HOW_IT_WORKS : parseHowItWorks(data?.value);
}

export async function updateServiceSteps(steps: HowItWorksStep[]) {
  await requireAdminOrTechnician();
  validateHowItWorks(steps);
  const value = JSON.stringify(steps);
  const { data, error } = await insforgeAdmin.database.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "how_it_works").select("key");
  if (error) throw new Error(error.message);
  if (!data?.length) {
    const { error: insertError } = await insforgeAdmin.database.from("site_settings").insert([{ key: "how_it_works", value }]);
    if (insertError) throw new Error(insertError.message);
  }
  updateTag("site-settings");
  revalidatePath("/servicio-tecnico");
  revalidatePath("/admin/servicio-tecnico");
}

export async function updateSiteSettings(settings: { taxRate: number; whatsappNumber: string; hero: HeroContent; howItWorks?: HowItWorksStep[] }) {
  const db = await getAdminDatabase();
  if (!Number.isFinite(settings.taxRate) || settings.taxRate < 0 || settings.taxRate > 100) {
    throw new Error("El IVA debe estar entre 0% y 100%.");
  }
  const whatsappNumber = settings.whatsappNumber.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(whatsappNumber)) throw new Error("Ingresa un número de WhatsApp válido con código de país.");
  validateHero(settings.hero);
  if (settings.howItWorks) validateHowItWorks(settings.howItWorks);

  const settingsToSave = [{ key: "tax_rate", value: String(settings.taxRate) }, { key: "whatsapp_number", value: whatsappNumber }, { key: "hero_content", value: JSON.stringify(settings.hero) }];
  if (settings.howItWorks) settingsToSave.push({ key: "how_it_works", value: JSON.stringify(settings.howItWorks) });
  for (const setting of settingsToSave) {
    const { data, error } = await db.from("site_settings").update({ value: setting.value, updated_at: new Date().toISOString() }).eq("key", setting.key).select("key");
    if (error) throw new Error(error.message);
    if (!data?.length) {
      const { error: insertError } = await db.from("site_settings").insert([setting]);
      if (insertError) throw new Error(insertError.message);
    }
  }

  updateTag("site-settings");
  revalidatePath("/admin/configuracion");
}

function validateHero(hero: HeroContent) {
  const textFields = [hero?.eyebrow, hero?.headline, hero?.description];
  if (textFields.some((field) => !field || typeof field.text !== "string" || field.text.trim().length < 1 || field.text.length > 500)) {
    throw new Error("Cada texto del hero debe tener entre 1 y 500 caracteres.");
  }
  const buttons = [hero?.primaryButton, hero?.secondaryButton];
  if (buttons.some((button) => !button || typeof button.text !== "string" || button.text.trim().length < 1 || button.text.length > 80 || typeof button.href !== "string" || !/^\/(?!\/)/.test(button.href))) {
    throw new Error("Los botones del hero requieren texto y una ruta interna válida.");
  }
}

function parseHowItWorks(value?: string): HowItWorksStep[] {
  try {
    const parsed = JSON.parse(value ?? "null") as HowItWorksStep[] | null;
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every((step) => step?.id && step?.title && step?.description) ? parsed : DEFAULT_HOW_IT_WORKS;
  } catch {
    return DEFAULT_HOW_IT_WORKS;
  }
}

function validateHowItWorks(steps: HowItWorksStep[]) {
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > 12) throw new Error("Debes conservar entre 1 y 12 pasos.");
  if (steps.some((step) => !step?.id || typeof step.title !== "string" || !step.title.trim() || step.title.length > 100 || typeof step.description !== "string" || !step.description.trim() || step.description.length > 500 || typeof step.visible !== "boolean")) throw new Error("Cada tarjeta requiere título y descripción válidos.");
}
