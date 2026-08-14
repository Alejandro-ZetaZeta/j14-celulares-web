import { NextResponse, type NextRequest } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage";

/**
 * Public image proxy. The product-images bucket is private; this route is
 * the only path the catalog uses to render images. The key is validated
 * against the products table so users cannot probe arbitrary storage paths.
 *
 * Response is cached aggressively — the storage key is content-addressed by
 * UUID, so it's safe to treat as immutable from the browser's perspective.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!key || key.includes("..") || !key.startsWith("products/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: galleryRow, error: galleryLookupError } = await insforgeAdmin
    .database
    .from("product_images")
    .select("id")
    .eq("image_key", key)
    .maybeSingle();

  if (galleryLookupError) {
    console.error("[image proxy] gallery lookup error:", galleryLookupError.message);
    return new NextResponse("Internal error", { status: 500 });
  }

  let exists = Boolean(galleryRow);
  if (!exists) {
    const { data: productRow, error: productLookupError } = await insforgeAdmin
      .database
      .from("products")
      .select("id")
      .eq("image_key", key)
      .maybeSingle();
    if (productLookupError) {
      console.error("[image proxy] product lookup error:", productLookupError.message);
      return new NextResponse("Internal error", { status: 500 });
    }
    exists = Boolean(productRow);
  }

  if (!exists) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: blob, error: downloadError } = await insforgeAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .download(key);

  if (downloadError || !blob) {
    console.error("[image proxy] download error:", downloadError?.message);
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType = blob.type || "application/octet-stream";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
