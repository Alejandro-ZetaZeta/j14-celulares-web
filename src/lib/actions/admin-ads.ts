"use server";

import { updateTag } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/roles";
import { insforgeAdmin } from "@/lib/insforge-admin";
import {
  AD_IMAGES_BUCKET,
  adImagePublicUrl,
  buildAdImageKey,
  buildAdMobileImageKey,
  isAllowedImageType,
} from "@/lib/storage";
import type { Ad } from "@/types/database";

// ── Image helpers ─────────────────────────────────────────────

const OUTPUT_MIME = "image/webp";

async function optimizeAdImage(
  file: File | Blob,
  opts: { maxWidth: number; maxHeight: number }
): Promise<Blob> {
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: opts.maxWidth, height: opts.maxHeight, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return new Blob([output], { type: OUTPUT_MIME });
}

/**
 * Upload an ad image to the `ad-images` bucket.
 * The bucket is public, so we get the public URL directly from InsForge.
 */
async function uploadAdImageFile(
  adId: string,
  file: File,
  variant: "desktop" | "mobile"
): Promise<{ url: string; key: string }> {
  if (!isAllowedImageType(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }

  const opts =
    variant === "desktop"
      ? { maxWidth: 1920, maxHeight: 1080 }
      : { maxWidth: 1080, maxHeight: 1920 };

  let optimized: Blob;
  try {
    optimized = await optimizeAdImage(file, opts);
  } catch {
    throw new Error("La imagen no es válida o no pudo optimizarse.");
  }

  const keyFn = variant === "desktop" ? buildAdImageKey : buildAdMobileImageKey;
  const key = keyFn(adId, OUTPUT_MIME);

  const { data: uploadData, error: uploadError } = await insforgeAdmin.storage
    .from(AD_IMAGES_BUCKET)
    .upload(key, optimized);

  if (uploadError || !uploadData) {
    throw new Error(`Error al subir imagen (${variant}): ${uploadError?.message}`);
  }

  // Public bucket: build URL using the InsForge storage format (/api/storage/...)
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
  const url = adImagePublicUrl(baseUrl, key);

  return { url, key };
}

async function deleteStorageKey(key: string) {
  await insforgeAdmin.storage
    .from(AD_IMAGES_BUCKET)
    .remove(key)
    .catch((err) => console.error("[admin-ads] storage delete failed:", err));
}

// ── Auth guard ────────────────────────────────────────────────

async function getAdsDb() {
  await requireAdmin();
  return insforgeAdmin.database;
}

// ── Read actions ──────────────────────────────────────────────

/** All ads including hidden — for the admin panel. */
export async function getAllAds(): Promise<Ad[]> {
  const db = await getAdsDb();
  const { data, error } = await db
    .from("ads")
    .select("id, title, image_url, image_key, image_mobile_url, image_mobile_key, link_url, display_order, is_hidden, created_at, updated_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Ad[];
}

/** Only visible ads ordered by display_order — for the public AdModal. */
export async function getVisibleAds(): Promise<Ad[]> {
  // Public read via service role (RLS policy also allows public SELECT on visible ads).
  // No requireAdmin() — this is called from the public layout server component.
  const { data, error } = await insforgeAdmin.database
    .from("ads")
    .select("id, title, image_url, image_key, image_mobile_url, image_mobile_key, link_url, display_order, is_hidden, created_at, updated_at")
    .eq("is_hidden", false)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Ad[];
}

// ── Write actions ─────────────────────────────────────────────

export interface AdFormInput {
  title: string;
  link_url?: string;
  desktopImage?: File | null;
  mobileImage?: File | null;
  display_order?: number;
}

/**
 * Create a new ad. Requires at least a desktop image.
 */
export async function createAd(input: {
  title: string;
  link_url: string;
  display_order: number;
  desktopImageFormData: FormData;
  mobileImageFormData?: FormData | null;
}): Promise<Ad> {
  const db = await getAdsDb();

  const desktopFile = input.desktopImageFormData.get("file") as File | null;
  if (!desktopFile) throw new Error("La imagen de escritorio es requerida.");

  // Insert a placeholder row first to get the ID for keying storage objects.
  const { data: row, error: insertError } = await db
    .from("ads")
    .insert([{
      title: input.title,
      link_url: input.link_url || null,
      display_order: input.display_order,
      image_url: "",
      image_key: "",
    }])
    .select()
    .single();

  if (insertError || !row) throw new Error(insertError?.message ?? "Error al crear el anuncio.");

  const adId = (row as { id: string }).id;

  try {
    const desktop = await uploadAdImageFile(adId, desktopFile, "desktop");

    let mobileUrl: string | null = null;
    let mobileKey: string | null = null;

    const mobileFile = input.mobileImageFormData?.get("file") as File | null;
    if (mobileFile) {
      const mobile = await uploadAdImageFile(adId, mobileFile, "mobile");
      mobileUrl = mobile.url;
      mobileKey = mobile.key;
    }

    const { data: updated, error: updateError } = await db
      .from("ads")
      .update({
        image_url: desktop.url,
        image_key: desktop.key,
        image_mobile_url: mobileUrl,
        image_mobile_key: mobileKey,
      })
      .eq("id", adId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    updateTag("ads");
    return updated as Ad;
  } catch (err) {
    // Clean up the placeholder row if image upload fails
    try { await db.from("ads").delete().eq("id", adId); } catch { /* best effort */ }
    throw err;
  }
}

/**
 * Update an existing ad's text fields and optionally replace images.
 */
export async function updateAd(
  id: string,
  input: {
    title: string;
    link_url: string;
    display_order: number;
    desktopImageFormData?: FormData | null;
    mobileImageFormData?: FormData | null;
    removeMobileImage?: boolean;
  }
): Promise<void> {
  const db = await getAdsDb();

  const patch: Record<string, unknown> = {
    title: input.title,
    link_url: input.link_url || null,
    display_order: input.display_order,
  };

  // Fetch current keys to clean up replaced images
  const { data: current } = await db.from("ads").select("image_key, image_mobile_key").eq("id", id).single();
  const currentDesktopKey = (current as { image_key: string | null } | null)?.image_key ?? null;
  const currentMobileKey = (current as { image_mobile_key: string | null } | null)?.image_mobile_key ?? null;

  const desktopFile = input.desktopImageFormData?.get("file") as File | null;
  if (desktopFile) {
    const desktop = await uploadAdImageFile(id, desktopFile, "desktop");
    patch.image_url = desktop.url;
    patch.image_key = desktop.key;
    if (currentDesktopKey && currentDesktopKey !== desktop.key) {
      await deleteStorageKey(currentDesktopKey);
    }
  }

  const mobileFile = input.mobileImageFormData?.get("file") as File | null;
  if (mobileFile) {
    const mobile = await uploadAdImageFile(id, mobileFile, "mobile");
    patch.image_mobile_url = mobile.url;
    patch.image_mobile_key = mobile.key;
    if (currentMobileKey && currentMobileKey !== mobile.key) {
      await deleteStorageKey(currentMobileKey);
    }
  } else if (input.removeMobileImage) {
    patch.image_mobile_url = null;
    patch.image_mobile_key = null;
    if (currentMobileKey) await deleteStorageKey(currentMobileKey);
  }

  const { error } = await db.from("ads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  updateTag("ads");
}

/**
 * Toggle is_hidden for a single ad.
 */
export async function toggleAdVisibility(id: string): Promise<boolean> {
  const db = await getAdsDb();
  const { data: current, error: fetchError } = await db
    .from("ads")
    .select("is_hidden")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const newHidden = !(current as { is_hidden: boolean }).is_hidden;
  const { error } = await db.from("ads").update({ is_hidden: newHidden }).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("ads");
  return newHidden;
}

/**
 * Reorder ads by providing a new ordered list of IDs.
 */
export async function reorderAds(ids: string[]): Promise<void> {
  const db = await getAdsDb();
  for (const [index, id] of ids.entries()) {
    const { error } = await db.from("ads").update({ display_order: index }).eq("id", id);
    if (error) throw new Error(`Error al reordenar: ${error.message}`);
  }
  updateTag("ads");
}

/**
 * Permanently delete an ad and its storage objects.
 */
export async function deleteAd(id: string): Promise<void> {
  const db = await getAdsDb();

  const { data: row } = await db
    .from("ads")
    .select("image_key, image_mobile_key")
    .eq("id", id)
    .single();

  const desktopKey = (row as { image_key: string | null } | null)?.image_key;
  const mobileKey = (row as { image_mobile_key: string | null } | null)?.image_mobile_key;

  const { error } = await db.from("ads").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (desktopKey) await deleteStorageKey(desktopKey);
  if (mobileKey) await deleteStorageKey(mobileKey);

  updateTag("ads");
}
