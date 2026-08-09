"use server";

import { updateTag, revalidatePath } from "next/cache";
import sharp from "sharp";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { getAdminDatabase } from "@/lib/insforge-server";
import {
  PRODUCT_IMAGES_BUCKET,
  buildProductImageKey,
  isAllowedImageType,
  productImageProxyUrl,
} from "@/lib/storage";

const OUTPUT_MIME = "image/webp";

async function optimizeProductImage(file: File | Blob): Promise<Blob> {
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return new Blob([output], { type: OUTPUT_MIME });
}

/**
 * Upload an image for a product. If the product already has an image_key,
 * the previous storage object is removed after the DB write succeeds.
 *
 * Orphan policy: a storage delete failure after a successful DB write is
 * logged but does not throw — the DB stays consistent (no dangling keys) and
 * the residual storage object can be cleaned up out-of-band.
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ image_url: string; image_key: string }> {
  const db = await getAdminDatabase();

  if (!isAllowedImageType(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }

  const { data: existing } = await db
    .from("products")
    .select("image_key")
    .eq("id", productId)
    .single();

  const previousKey = (existing as { image_key: string | null } | null)?.image_key ?? null;
  const key = buildProductImageKey(productId, OUTPUT_MIME);
  let optimizedFile: Blob;

  try {
    optimizedFile = await optimizeProductImage(file);
  } catch {
    throw new Error("La imagen no es válida o no pudo optimizarse.");
  }

  const { error: uploadError } = await insforgeAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(key, optimizedFile);

  if (uploadError) {
    throw new Error(`Error al subir la imagen: ${uploadError.message}`);
  }

  const { error: updateError } = await db
    .from("products")
    .update({ image_url: productImageProxyUrl(key), image_key: key })
    .eq("id", productId);

  if (updateError) {
    await insforgeAdmin.storage.from(PRODUCT_IMAGES_BUCKET).remove(key).catch(() => {});
    throw new Error(`Error al guardar la imagen: ${updateError.message}`);
  }

  if (previousKey && previousKey !== key) {
    await insforgeAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(previousKey)
      .catch((err) => console.error("[uploadProductImage] cleanup failed:", err));
  }

  updateTag("products");
  updateTag(`product-${productId}`);
  revalidatePath(`/admin/productos/${productId}/editar`);
  return { image_url: productImageProxyUrl(key), image_key: key };
}

/**
 * Remove the image from storage and clear the DB fields.
 * The product row is intentionally not touched (variant/product data is preserved).
 */
export async function deleteProductImage(
  productId: string
): Promise<void> {
  const db = await getAdminDatabase();
  const { data: existing } = await db
    .from("products")
    .select("image_key")
    .eq("id", productId)
    .single();

  const key = (existing as { image_key: string | null } | null)?.image_key ?? null;

  const { error: updateError } = await db
    .from("products")
    .update({ image_url: null, image_key: null })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Error al limpiar la imagen: ${updateError.message}`);
  }

  if (key) {
    await insforgeAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(key)
      .catch((err) => console.error("[deleteProductImage] storage cleanup failed:", err));
  }

  updateTag("products");
  updateTag(`product-${productId}`);
  revalidatePath(`/admin/productos/${productId}/editar`);
}

/**
 * Internal helper used by deleteProduct to ensure the storage object goes
 * away with the row. Best-effort: a failure here does not block the row
 * delete (we accept the small risk of an orphaned storage file over a
 * dangling DB key).
 */
export async function deleteProductImageBestEffort(
  productId: string,
  knownKey?: string
): Promise<void> {
  const key = knownKey ?? await (async () => {
    const db = await getAdminDatabase();
    const { data } = await db.from("products").select("image_key").eq("id", productId).single();
    return (data as { image_key: string | null } | null)?.image_key ?? null;
  })();
  if (!key) return;

  await insforgeAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(key)
    .catch((err) => console.error("[deleteProductImageBestEffort] failed:", err));
}
