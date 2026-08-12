"use server";

import { updateTag } from "next/cache";
import { getAdminDatabase } from "@/lib/insforge-server";
import type { ProductGift, Promotion } from "@/types/database";

export type PromotionInput = Omit<Promotion, "id" | "created_at" | "used_count" | "promotion_products"> & { product_ids: string[] };

const promotionFields = "id, code, name, description, promotion_type, discount_value, min_subtotal, starts_at, ends_at, max_uses, used_count, active, created_at, promotion_products(product_id)";

export async function getAllPromotions(): Promise<Promotion[]> {
  const db = await getAdminDatabase();
  const { data, error } = await db.from("promotions").select(promotionFields).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Promotion[];
}

export async function createPromotion(input: PromotionInput) {
  const db = await getAdminDatabase();
  const { product_ids, ...promotion } = input;
  const normalizedPromotion = { ...promotion, discount_value: promotion.promotion_type === "gift" ? 0 : promotion.discount_value, code: promotion.code.trim().toUpperCase() };
  const { data, error } = await db.from("promotions").insert([normalizedPromotion]).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear la promoción.");
  if (product_ids.length) {
    const { error: productsError } = await db.from("promotion_products").insert(product_ids.map((product_id) => ({ promotion_id: data.id, product_id })));
    if (productsError) throw new Error(productsError.message);
  }
  updateTag("promotions");
  return data;
}

export async function updatePromotion(id: string, input: Partial<PromotionInput>) {
  const db = await getAdminDatabase();
  const { product_ids, ...promotion } = input;
  const { error } = await db.from("promotions").update({ ...promotion, ...(promotion.promotion_type === "gift" ? { discount_value: 0 } : {}), ...(promotion.code ? { code: promotion.code.trim().toUpperCase() } : {}) }).eq("id", id);
  if (error) throw new Error(error.message);
  if (product_ids) {
    await db.from("promotion_products").delete().eq("promotion_id", id);
    if (product_ids.length) {
      const { error: productsError } = await db.from("promotion_products").insert(product_ids.map((product_id) => ({ promotion_id: id, product_id })));
      if (productsError) throw new Error(productsError.message);
    }
  }
  updateTag("promotions");
}

export async function deletePromotion(id: string) {
  const db = await getAdminDatabase();
  const { error } = await db.from("promotions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("promotions");
}

export async function getProductGifts(productId: string): Promise<ProductGift[]> {
  const db = await getAdminDatabase();
  const { data, error } = await db.from("product_gifts").select("product_id, gift_product_id, quantity, gift_product:products!product_gifts_gift_product_id_fkey(id, brand, model, type, image_url, product_variants(id, capacity, color, price, stock))").eq("product_id", productId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductGift[];
}

export async function setProductGifts(productId: string, gifts: Array<{ gift_product_id: string; quantity: number }>) {
  const db = await getAdminDatabase();
  const unique = gifts.filter((gift, index, all) => gift.gift_product_id !== productId && all.findIndex((other) => other.gift_product_id === gift.gift_product_id) === index && gift.quantity > 0);
  if (unique.length) {
    const { data: giftProducts, error: giftProductsError } = await db.from("products").select("id, product_variants(stock)").in("id", unique.map((gift) => gift.gift_product_id));
    if (giftProductsError) throw new Error(giftProductsError.message);
    const available = new Set((giftProducts ?? []).filter((product) => (product.product_variants ?? []).some((variant: { stock: number }) => Number(variant.stock) > 0)).map((product) => String(product.id)));
    if (available.size !== unique.length) throw new Error("Cada regalo debe existir y tener stock disponible.");
  }
  await db.from("product_gifts").delete().eq("product_id", productId);
  if (unique.length) {
    const { error } = await db.from("product_gifts").insert(unique.map((gift) => ({ product_id: productId, gift_product_id: gift.gift_product_id, quantity: gift.quantity })));
    if (error) throw new Error(error.message);
  }
  updateTag("products");
  updateTag(`product-${productId}`);
}
