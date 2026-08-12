"use server";

import { updateTag } from "next/cache";
import { getAdminDatabase } from "@/lib/insforge-server";
import type { Product, ProductVariant, PhoneSerial, ProductWithVariants } from "@/types/database";
import { deleteProductImageBestEffort } from "@/lib/actions/admin-product-images";

// ── Products ──────────────────────────────────────────────────

export async function getAllProducts() {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("products")
    .select(`id, brand, model, type, image_url, image_key, allows_installments, is_featured, featured_order, featured_eyebrow, featured_headline, featured_description, featured_cta, created_at, product_variants(id, capacity, color, price, stock, battery_condition)`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getProductForAdmin(id: string) {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("products")
    .select(`id, brand, model, type, image_url, allows_installments, is_featured, featured_order, featured_eyebrow, featured_headline, featured_description, featured_cta, created_at, product_variants(id, product_id, capacity, color, price, stock, battery_condition, created_at)`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ProductWithVariants;
}

export async function createProduct(formData: FormData) {
  const db = await getAdminDatabase();
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const type = formData.get("type") as string;
  const allowsInstallments = formData.get("allows_installments") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const featuredOrder = Number(formData.get("featured_order") || 100);
  const featuredEyebrow = String(formData.get("featured_eyebrow") || "").trim() || null;
  const featuredHeadline = String(formData.get("featured_headline") || "").trim() || null;
  const featuredDescription = String(formData.get("featured_description") || "").trim() || null;
  const featuredCta = String(formData.get("featured_cta") || "").trim() || null;

  const { data, error } = await db
    .from("products")
    .insert([{ brand, model, type, allows_installments: allowsInstallments, is_featured: isFeatured, featured_order: featuredOrder, featured_eyebrow: featuredEyebrow, featured_headline: featuredHeadline, featured_description: featuredDescription, featured_cta: featuredCta }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  updateTag("products");
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Pick<Product, "brand" | "model" | "type" | "image_url" | "allows_installments" | "is_featured" | "featured_order" | "featured_eyebrow" | "featured_headline" | "featured_description" | "featured_cta">>) {
  const db = await getAdminDatabase();
  const { error } = await db.from("products").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("products");
  updateTag(`product-${id}`);
}

export async function deleteProduct(id: string) {
  const db = await getAdminDatabase();
  const { data: product } = await db.from("products").select("image_key").eq("id", id).single();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (product?.image_key) await deleteProductImageBestEffort(id, product.image_key as string);
  updateTag("products");
  updateTag(`product-${id}`);
}

// ── Variants ──────────────────────────────────────────────────

export async function createVariant(productId: string, data: Omit<ProductVariant, "id" | "product_id" | "created_at">) {
  const db = await getAdminDatabase();
  const { data: variant, error } = await db
    .from("product_variants")
    .insert([{ product_id: productId, ...data }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  updateTag("products");
  return variant as ProductVariant;
}

export async function updateVariant(id: string, updates: Partial<Omit<ProductVariant, "id" | "product_id" | "created_at">>) {
  const db = await getAdminDatabase();
  const { error } = await db.from("product_variants").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("products");
}

export async function deleteVariant(id: string) {
  const db = await getAdminDatabase();
  const { error } = await db.from("product_variants").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("products");
}

export async function updateStock(variantId: string, newStock: number) {
  const db = await getAdminDatabase();
  const { error } = await db
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", variantId);
  if (error) throw new Error(error.message);
  updateTag("products");
}

// ── Phone Serials (IMEI) ──────────────────────────────────────

export async function getSerialsByVariant(variantId: string): Promise<PhoneSerial[]> {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("phone_serials")
    .select("*")
    .eq("variant_id", variantId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as PhoneSerial[];
}

export async function addSerial(variantId: string, imei: string): Promise<PhoneSerial> {
  const db = await getAdminDatabase();

  // Insert serial and increment variant stock atomically
  const { data, error } = await db
    .from("phone_serials")
    .insert([{ variant_id: variantId, imei, is_sold: false }])
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Increment stock
  const { data: variant } = await db
    .from("product_variants")
    .select("stock")
    .eq("id", variantId)
    .single();
  if (variant) {
    await db
      .from("product_variants")
      .update({ stock: (variant as ProductVariant).stock + 1 })
      .eq("id", variantId);
  }

  updateTag("products");
  return data as PhoneSerial;
}

export async function markSerialSold(serialId: string, variantId: string) {
  const db = await getAdminDatabase();
  await db.from("phone_serials").update({ is_sold: true }).eq("id", serialId);

  // Decrement stock
  const { data: variant } = await db
    .from("product_variants")
    .select("stock")
    .eq("id", variantId)
    .single();
  if (variant) {
    const newStock = Math.max(0, (variant as ProductVariant).stock - 1);
    await db.from("product_variants").update({ stock: newStock }).eq("id", variantId);
  }

  updateTag("products");
}

export async function deleteSerial(serialId: string, variantId: string) {
  const db = await getAdminDatabase();
  const { data: serial } = await db
    .from("phone_serials")
    .select("is_sold")
    .eq("id", serialId)
    .single();

  await db.from("phone_serials").delete().eq("id", serialId);

  // Only decrement stock if the serial was not already sold
  if (serial && !(serial as PhoneSerial).is_sold) {
    const { data: variant } = await db
      .from("product_variants")
      .select("stock")
      .eq("id", variantId)
      .single();
    if (variant) {
      const newStock = Math.max(0, (variant as ProductVariant).stock - 1);
      await db.from("product_variants").update({ stock: newStock }).eq("id", variantId);
    }
  }
  updateTag("products");
}

