import { insforgeAdmin } from "@/lib/insforge-admin";
import { roundCents } from "@/lib/cart";

export interface PromotionCheckItem { variantId: string; quantity: number }

export async function calculatePromotion(code: string, items: PromotionCheckItem[]): Promise<{ error: string } | { promotion: { id: string; promotion_type: string }; discount: number; eligibleProductIds: string[]; code: string }> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { error: "Ingresa un código de promoción." };
  const { data: promotion } = await insforgeAdmin.database.from("promotions").select("id, code, name, promotion_type, discount_value, min_subtotal, starts_at, ends_at, max_uses, used_count, active, promotion_products(product_id)").eq("code", normalizedCode).maybeSingle();
  if (!promotion || !promotion.active) return { error: "Código de promoción inválido." };
  const now = Date.now();
  if ((promotion.starts_at && now < new Date(promotion.starts_at).getTime()) || (promotion.ends_at && now > new Date(promotion.ends_at).getTime())) return { error: "Esta promoción no está vigente." };
  if (promotion.max_uses !== null && promotion.used_count >= promotion.max_uses) return { error: "Esta promoción agotó sus usos." };
  const ids = [...new Set(items.map((item) => item.variantId))];
  const { data: variants } = await insforgeAdmin.database.from("product_variants").select("id, product_id, price, stock").in("id", ids);
  if (!variants || variants.length !== ids.length) return { error: "Carrito contiene productos no disponibles." };
  const targets = new Set((promotion.promotion_products ?? []).map((target: { product_id: string }) => target.product_id));
  const eligible = variants.filter((variant) => targets.size === 0 || targets.has(variant.product_id));
  const eligibleSubtotal = roundCents(eligible.reduce((sum, variant) => sum + Number(variant.price) * (items.find((item) => item.variantId === variant.id)?.quantity ?? 0), 0));
  if (eligibleSubtotal < Number(promotion.min_subtotal)) return { error: `Compra mínima para esta promoción: $${Number(promotion.min_subtotal).toFixed(2)}.` };
  const discount = promotion.promotion_type === "percentage" ? roundCents(eligibleSubtotal * Number(promotion.discount_value) / 100) : promotion.promotion_type === "fixed" ? roundCents(Math.min(eligibleSubtotal, Number(promotion.discount_value))) : 0;
  return { promotion: promotion as { id: string; promotion_type: string }, discount, eligibleProductIds: eligible.map((variant) => variant.product_id), code: normalizedCode };
}
