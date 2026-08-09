import { cacheLife, cacheTag } from "next/cache";
import { insforge } from "@/lib/insforge";

export const DEFAULT_TAX_RATE = 15;
export const DEFAULT_WHATSAPP_NUMBER = "593960507959";

export interface HeroTextBlock {
  text: string;
  visible: boolean;
}

export interface HeroButton {
  text: string;
  href: string;
  visible: boolean;
}

export interface HeroContent {
  eyebrow: HeroTextBlock;
  headline: HeroTextBlock;
  description: HeroTextBlock;
  primaryButton: HeroButton;
  secondaryButton: HeroButton;
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  eyebrow: { text: "Catálogo actualizado", visible: true },
  headline: { text: "Tu próximo smartphone, aquí.", visible: true },
  description: {
    text: "Android e iPhone — sellados y Open Box — con stock en tiempo real y servicio técnico transparente.",
    visible: true,
  },
  primaryButton: { text: "Ver Catálogo", href: "/catalogo", visible: true },
  secondaryButton: { text: "Consultar mi Reparación", href: "/servicio-tecnico", visible: true },
};

export interface SiteSettings {
  taxRate: number;
  whatsappNumber: string;
  hero: HeroContent;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("site-settings");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("site_settings")
    .select("key, value")
    .in("key", ["tax_rate", "whatsapp_number", "hero_content"]);

  if (error) {
    console.error("[getSiteSettings] Error:", error.message);
    return { taxRate: DEFAULT_TAX_RATE, whatsappNumber: DEFAULT_WHATSAPP_NUMBER, hero: DEFAULT_HERO_CONTENT };
  }

  const values = new Map((data ?? []).map((setting) => [String(setting.key), String(setting.value)]));
  const taxRate = Number(values.get("tax_rate"));
  const whatsappNumber = (values.get("whatsapp_number") ?? DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
  let hero = DEFAULT_HERO_CONTENT;
  try {
    const parsed = JSON.parse(values.get("hero_content") ?? "null") as Partial<HeroContent> | null;
    if (parsed?.eyebrow && parsed.headline && parsed.description && parsed.primaryButton && parsed.secondaryButton) {
      hero = parsed as HeroContent;
    }
  } catch {
    // Invalid persisted content falls back to safe defaults.
  }

  return {
    taxRate: Number.isFinite(taxRate) && taxRate >= 0 && taxRate <= 100 ? taxRate : DEFAULT_TAX_RATE,
    whatsappNumber: whatsappNumber || DEFAULT_WHATSAPP_NUMBER,
    hero,
  };
}
