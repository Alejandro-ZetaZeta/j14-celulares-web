import { cacheTag, cacheLife } from "next/cache";
import { insforge } from "@/lib/insforge";
import type { ProductWithVariants, CreditCardRate, CatalogCollection } from "@/types/database";

// ─────────────────────────────────────────────────────────────────────────────
// Cached catalog data functions
//
// These are plain async functions (NOT Server Actions) with the `use cache`
// directive. Next.js caches their return values on the server and invalidates
// them only when an admin action calls `updateTag("products")` or
// `updateTag(`product-${id}`)`.
//
// `cacheLife("max")` disables automatic time-based expiry — we rely entirely
// on tag-based invalidation so the cache is always fresh after an admin edit
// and never stale during the 60s ISR window.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all products with their variants (stock > 0 via RLS).
 * Cached indefinitely; invalidated via `updateTag("products")`.
 */
export async function getProducts(): Promise<ProductWithVariants[]> {
  "use cache";
  cacheTag("products");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("products")
    .select(`
      id, brand, model, type, image_url, image_key, allows_installments, is_featured, featured_order, featured_eyebrow, featured_headline, featured_description, featured_cta, created_at,
       product_images (id, product_id, image_url, image_key, display_order, created_at),
       product_variants (
         id, product_id, capacity, color, price, stock, battery_condition, created_at
       ),
       product_gifts!product_gifts_product_id_fkey (product_id, gift_product_id, quantity, gift_product:products!product_gifts_gift_product_id_fkey(id, brand, model, type, image_url, product_variants(id, product_id, capacity, color, price, stock, battery_condition, created_at)))
    `)
     .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProducts] Error:", error.message);
    return [];
  }

  // Filter out products with zero total stock (extra safety layer)
  return (data as unknown as ProductWithVariants[]).filter(
    (p) =>
      p.product_variants &&
      p.product_variants.some((v) => v.stock > 0)
  ).map((p) => ({
    ...p,
    product_images: (p.product_images ?? []).sort((a, b) => a.display_order - b.display_order),
  }));
}

/**
 * Fetch a single product with all its variants by ID.
 * Cached per product ID; invalidated via `updateTag(`product-${id}`)`.
 */
export async function getProductById(
  id: string
): Promise<ProductWithVariants | null> {
  "use cache";
  cacheTag("products", `product-${id}`);
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("products")
    .select(`
      id, brand, model, type, image_url, image_key, allows_installments, is_featured, featured_order, featured_eyebrow, featured_headline, featured_description, featured_cta, created_at,
       product_images (id, product_id, image_url, image_key, display_order, created_at),
       product_variants (
         id, product_id, capacity, color, price, stock, battery_condition, created_at
       ),
       product_gifts!product_gifts_product_id_fkey (product_id, gift_product_id, quantity, gift_product:products!product_gifts_gift_product_id_fkey(id, brand, model, type, image_url, product_variants(id, product_id, capacity, color, price, stock, battery_condition, created_at)))
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getProductById] Error:", error.message);
    return null;
  }

  const product = data as unknown as ProductWithVariants;
  return {
    ...product,
    product_images: (product.product_images ?? []).sort((a, b) => a.display_order - b.display_order),
  };
}

/**
 * Fetch active credit card installment rates visible to customers.
 * Cached indefinitely; invalidated via `updateTag("credit-card-rates")`.
 */
export async function getCreditCardRates(): Promise<CreditCardRate[]> {
  "use cache";
  cacheTag("credit-card-rates");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("credit_card_rates")
    .select("id, months, interest_multiplier, active, created_at")
    .eq("active", true)
    .order("months", { ascending: true });

  if (error) {
    console.error("[getCreditCardRates] Error:", error.message);
    return [];
  }

  return (data as CreditCardRate[]) ?? [];
}

/**
 * Fetch distinct Android brands.
 * Cached with the `products` tag — invalidated when any product changes.
 */
export async function getAndroidBrands(): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("products")
    .select("brand")
    .eq("type", "android")
    .order("brand");

  if (error || !data) return [];
  const brands = [...new Set(data.map((p: { brand: string }) => p.brand))];
  return brands;
}

export interface BrandModelGroup {
  brand: string;
  models: string[];
}

export async function getCatalogCollections(): Promise<CatalogCollection[]> {
  "use cache";
  cacheTag("collections");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("catalog_collections")
    .select("id, slug, label, description, match_type, match_value, show_as_chip, show_on_home, pin_order, is_active, created_at")
    .eq("is_active", true)
    .order("pin_order", { ascending: true });

  if (error || !data) return [];
  return data as CatalogCollection[];
}

export async function getBrandModelGroups(products?: ProductWithVariants[]): Promise<BrandModelGroup[]> {
  const source = products ?? await getProducts();
  const groups = new Map<string, Set<string>>();
  for (const product of source) {
    const models = groups.get(product.brand) ?? new Set<string>();
    models.add(product.model);
    groups.set(product.brand, models);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([brand, models]) => ({ brand, models: [...models].sort((a, b) => a.localeCompare(b)) }));
}

export async function getFeaturedProducts(): Promise<ProductWithVariants[]> {
  const products = await getProducts();
  return products
    .filter((product) => product.is_featured)
    .sort((a, b) => a.featured_order - b.featured_order)
    .slice(0, 6);
}
