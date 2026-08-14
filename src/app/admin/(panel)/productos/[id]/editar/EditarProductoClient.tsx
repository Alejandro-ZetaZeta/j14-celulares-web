"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/lib/actions/admin-products";
import { setProductGifts } from "@/lib/actions/admin-promotions";
import {
  deleteProductImageById,
  uploadProductImages,
  reorderProductImages,
} from "@/lib/actions/admin-product-images";
import type { ProductWithVariants } from "@/types/database";
import ImageUploadZone, { type ExistingImage } from "@/components/admin/ImageUploadZone";

type VariantRow = {
  id?: string;
  capacity: string;
  color: string;
  price: string;
  stock: string;
  battery_condition: string;
  _deleted?: boolean;
};

function variantFromExisting(v: ProductWithVariants["product_variants"][number]): VariantRow {
  return {
    id: v.id,
    capacity: v.capacity,
    color: v.color,
    price: String(v.price),
    stock: String(v.stock),
    battery_condition: v.battery_condition === null ? "" : String(v.battery_condition),
  };
}

function newVariantRow(): VariantRow {
  return { capacity: "", color: "", price: "", stock: "0", battery_condition: "" };
}

export default function EditarProductoClient({
  product,
  productOptions,
  initialGiftIds,
}: {
  product: ProductWithVariants;
  productOptions: ProductWithVariants[];
  initialGiftIds: string[];
}) {
  const router = useRouter();
  const [brand, setBrand] = useState(product.brand);
  const [model, setModel] = useState(product.model);
  const [type, setType] = useState(product.type);
  const [allowsInstallments, setAllowsInstallments] = useState(product.allows_installments ?? true);
  const [isFeatured, setIsFeatured] = useState(product.is_featured ?? false);
  const [featuredOrder, setFeaturedOrder] = useState(String(product.featured_order ?? 100));
  const [featuredEyebrow, setFeaturedEyebrow] = useState(product.featured_eyebrow ?? "");
  const [featuredHeadline, setFeaturedHeadline] = useState(product.featured_headline ?? "");
  const [featuredDescription, setFeaturedDescription] = useState(product.featured_description ?? "");
  const [featuredCta, setFeaturedCta] = useState(product.featured_cta ?? "");
  const [imageOrder, setImageOrder] = useState<string[]>(
    (product.product_images ?? []).sort((a, b) => a.display_order - b.display_order).map((img) => img.id)
  );
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>(
    product.product_variants.map(variantFromExisting)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [giftsEnabled, setGiftsEnabled] = useState(initialGiftIds.length > 0);
  const [giftProductId, setGiftProductId] = useState(initialGiftIds[0] ?? "");
  const [giftSearch, setGiftSearch] = useState("");

  const isOpenBox = type === "open_box_iphone";

  function updateVariantField(index: number, field: keyof VariantRow, value: string) {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function markDeleted(index: number) {
    setVariants((prev) => {
      const updated = [...prev];
      const row = updated[index];
      if (row.id) {
        updated[index] = { ...row, _deleted: true };
      } else {
        updated.splice(index, 1);
      }
      return updated;
    });
  }

  function addVariant() {
    setVariants((prev) => [...prev, newVariantRow()]);
  }

  function restoreDeleted(index: number) {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _deleted: false };
      return updated;
    });
  }

  // Build existing images list for ImageUploadZone (sorted, excluding removed)
  const existingImagesForZone: ExistingImage[] = imageOrder
    .filter((id) => !removedImageIds.has(id))
    .flatMap((id) => {
      const img = product.product_images?.find((i) => i.id === id);
      return img ? [{ id, url: img.image_url }] : [];
    });

  const handleReorderExisting = useCallback((ids: string[]) => {
    // ids = new order of visible saved images; re-insert removed ones won't happen
    setImageOrder(ids);
  }, []);

  const handleRemoveExisting = useCallback((id: string) => {
    setRemovedImageIds((prev) => new Set([...prev, id]));
    setImageOrder((prev) => prev.filter((i) => i !== id));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSaving(true);

    try {
      await updateProduct(product.id, { brand, model, type, allows_installments: allowsInstallments, is_featured: isFeatured, featured_order: Number.isFinite(Number(featuredOrder)) ? Number(featuredOrder) : 100, featured_eyebrow: featuredEyebrow.trim() || null, featured_headline: featuredHeadline.trim() || null, featured_description: featuredDescription.trim() || null, featured_cta: featuredCta.trim() || null });

      const kept = variants.filter((v) => !v._deleted);
      const deleted = variants.filter((v) => v._deleted && v.id);

      for (const v of kept) {
        if (!v.capacity || !v.color || !v.price) continue;
        const payload = {
          capacity: v.capacity,
          color: v.color,
          price: parseFloat(v.price),
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
          battery_condition:
            isOpenBox && v.battery_condition ? parseInt(v.battery_condition, 10) : null,
        };
        if (v.id) {
          await updateVariant(v.id, payload);
        } else {
          await createVariant(product.id, payload);
        }
      }

      for (const v of deleted) {
        if (v.id) await deleteVariant(v.id);
      }
      await setProductGifts(product.id, giftsEnabled && giftProductId ? [{ gift_product_id: giftProductId, quantity: 1 }] : []);
      await reorderProductImages(product.id, imageOrder);

      // Delete any saved images the user removed
      for (const id of removedImageIds) {
        await deleteProductImageById(product.id, id);
      }

      // Upload new pending files (appended after saved images)
      if (pendingFiles.length) {
        await uploadProductImages(product.id, pendingFiles);
      }

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  }



  const activeVariants = variants.map((v, i) => ({ v, i })).filter(({ v }) => !v._deleted);
  const deletedVariants = variants.map((v, i) => ({ v, i })).filter(({ v }) => v._deleted);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Editar Producto</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Modifica los datos del producto y sus variantes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 rounded-[var(--radius-md)] px-4 py-3 text-[14px]"
          >
            {error}
          </div>
        )}

        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-5">
          <h2 className="text-[16px] font-semibold">Información del producto</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand" className="text-[14px] font-medium">Marca</label>
              <input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="input-field px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model" className="text-[14px] font-medium">Modelo</label>
              <input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="input-field px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
             <label htmlFor="product-type" className="text-[14px] font-medium">Tipo o categoría</label>
             <input
               id="product-type"
               value={type}
               onChange={(e) => setType(e.target.value)}
               placeholder="Celular, cargador, cable, funda..."
               required
               className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
             />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={allowsInstallments}
              onChange={(e) => setAllowsInstallments(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)]"
            />
            <span className="text-[14px] font-medium">Permitir financiamiento / cuotas con tarjeta</span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-[var(--accent)]" /><span><span className="block text-[14px] font-medium">Mostrar en inicio</span><span className="block text-[12px] text-[var(--text-tertiary)]">Usa presentación visual destacada.</span></span></label>
            <label className="flex flex-col gap-1 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]"><span className="text-[12px] font-medium">Orden destacado</span><input type="number" min="0" value={featuredOrder} onChange={(e) => setFeaturedOrder(e.target.value)} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-[14px]" /></label>
          </div>
          {isFeatured && <div className="featured-copy-fields grid gap-3 border-l-2 border-[var(--accent)] pl-4"><p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Mensaje de portada</p><label className="flex flex-col gap-1 text-[12px] font-medium">Frase superior<input value={featuredEyebrow} onChange={(e) => setFeaturedEyebrow(e.target.value)} placeholder="Ej. Rendimiento sin concesiones" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label><label className="flex flex-col gap-1 text-[12px] font-medium">Titular<input value={featuredHeadline} onChange={(e) => setFeaturedHeadline(e.target.value)} placeholder="Titular personalizado (opcional)" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label><label className="flex flex-col gap-1 text-[12px] font-medium">Descripción<textarea value={featuredDescription} onChange={(e) => setFeaturedDescription(e.target.value)} rows={3} placeholder="Describe por qué este equipo merece atención." className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label><label className="flex flex-col gap-1 text-[12px] font-medium">Texto del botón<input value={featuredCta} onChange={(e) => setFeaturedCta(e.target.value)} placeholder="Texto del botón (ej. Ver equipo)" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label></div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium">Fotos del producto</label>
            <ImageUploadZone
              files={pendingFiles}
              onChange={setPendingFiles}
              existingImages={existingImagesForZone}
              onReorderExisting={handleReorderExisting}
              onRemoveExisting={handleRemoveExisting}
              disabled={saving}
            />
          </div>
        </section>

        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-4">
          <label className="flex items-center gap-3 text-[14px] font-medium"><input type="checkbox" checked={giftsEnabled} onChange={(event) => setGiftsEnabled(event.target.checked)} className="h-5 w-5 accent-[var(--accent)]" /> Este producto incluye un regalo</label>
          {giftsEnabled && <div className="flex flex-col gap-2"><p className="text-[12px] text-[var(--text-tertiary)]">Busca un producto existente con stock disponible.</p><input value={giftSearch} onChange={(event) => setGiftSearch(event.target.value)} placeholder="Buscar producto regalo..." className="input-apple" /><select required value={giftProductId} onChange={(event) => setGiftProductId(event.target.value)} className="input-apple"><option value="">Selecciona un producto</option>{productOptions.filter((option) => option.id !== product.id && `${option.brand} ${option.model}`.toLowerCase().includes(giftSearch.toLowerCase()) && (option.product_variants ?? []).some((variant) => variant.stock > 0)).map((option) => <option key={option.id} value={option.id}>{option.brand} {option.model}</option>)}</select></div>}
        </section>

        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Variantes</h2>
            <button
              type="button"
              onClick={addVariant}
              className="text-[13px] text-[var(--accent)] hover:underline font-medium"
            >
              + Agregar variante
            </button>
          </div>

          {activeVariants.length === 0 ? (
            <p className="text-[14px] text-[var(--text-tertiary)] py-4">
              Sin variantes. Agrega al menos una.
            </p>
          ) : (
            activeVariants.map(({ v, i }) => (
              <div
                key={v.id ?? `new-${i}`}
                className="grid grid-cols-2 gap-3 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] relative"
              >
                <p className="col-span-2 text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Variante {i + 1}
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium">Capacidad</label>
                  <input
                    type="text"
                    value={v.capacity}
                    onChange={(e) => updateVariantField(i, "capacity", e.target.value)}
                    placeholder="128GB"
                    className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium">Color</label>
                  <input
                    type="text"
                    value={v.color}
                    onChange={(e) => updateVariantField(i, "color", e.target.value)}
                    placeholder="Negro"
                    className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium">Precio (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.price}
                    onChange={(e) => updateVariantField(i, "price", e.target.value)}
                    placeholder="799.00"
                    className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v.stock}
                    onChange={(e) => updateVariantField(i, "stock", e.target.value)}
                    placeholder="0"
                    className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                {isOpenBox && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[13px] font-medium">Batería (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={v.battery_condition}
                      onChange={(e) => updateVariantField(i, "battery_condition", e.target.value)}
                      placeholder="89"
                      className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => markDeleted(i)}
                  className="absolute top-3 right-3 text-[12px] text-[var(--status-red)] hover:underline"
                  aria-label={`Eliminar variante ${i + 1}`}
                >
                  Eliminar
                </button>
              </div>
            ))
          )}

          {deletedVariants.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Se eliminarán al guardar
              </p>
              {deletedVariants.map(({ v, i }) => (
                <div
                  key={`del-${v.id ?? i}`}
                  className="flex items-center justify-between text-[13px] text-[var(--text-secondary)] px-3 py-2 bg-red-50 rounded-[var(--radius-sm)]"
                >
                  <span>
                    {v.capacity} {v.color} — ${v.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => restoreDeleted(i)}
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
