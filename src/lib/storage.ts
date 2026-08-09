/**
 * Storage helpers for product images.
 *
 * The `product-images` bucket is private (no RLS policies on storage.objects),
 * so end users cannot read or write storage objects directly. Public catalog
 * images are streamed through the Next.js proxy at /api/images/[...key].
 *
 * All admin writes go through the service_role admin client, which bypasses RLS.
 */
export const PRODUCT_IMAGES_BUCKET = "product-images";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedImageType(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function extForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "bin";
}

/**
 * Build a deterministic-ish storage key. The product id scopes the file so
 * listing-by-product is straightforward; the random suffix prevents
 * overwrites when the same product is re-uploaded before the old one is purged.
 */
export function buildProductImageKey(productId: string, mime: string): string {
  const ext = extForMime(mime);
  const suffix = crypto.randomUUID().slice(0, 8);
  return `products/${productId}/image-${Date.now()}-${suffix}.${ext}`;
}

/**
 * The catalog renders <img src={image_url}>. For private buckets the URL must
 * point at our proxy, not at the InsForge storage host.
 */
export function productImageProxyUrl(key: string): string {
  return `/api/images/${key}`;
}
