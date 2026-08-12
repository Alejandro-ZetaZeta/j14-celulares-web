"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, createVariant } from "@/lib/actions/admin-products";
import { setProductGifts } from "@/lib/actions/admin-promotions";
import type { ProductWithVariants } from "@/types/database";
import { uploadProductImage } from "@/lib/actions/admin-product-images";

const PRODUCT_TYPES = [
  { value: "android", label: "Android" },
  { value: "sealed_iphone", label: "iPhone Sellado" },
  { value: "open_box_iphone", label: "iPhone Open Box" },
];

interface VariantRow {
  capacity: string;
  color: string;
  price: string;
  stock: string;
  battery_condition: string;
}

function emptyVariant(): VariantRow {
  return { capacity: "", color: "", price: "", stock: "0", battery_condition: "" };
}

export default function NuevoProductoClient({ productOptions }: { productOptions: ProductWithVariants[] }) {
  const router = useRouter();
  const [productType, setProductType] = useState("android");
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [giftsEnabled, setGiftsEnabled] = useState(false);
  const [giftProductId, setGiftProductId] = useState("");
  const [giftSearch, setGiftSearch] = useState("");

  const isOpenBox = productType === "open_box_iphone";

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set("type", productType);

      // Create the product
      const product = await createProduct(formData);

      // Upload image (if provided) — uses the new product id in the storage key
      if (imageFile) {
        await uploadProductImage(product.id, imageFile);
      }

      // Create each variant
      await Promise.all(
        variants
          .filter((v) => v.capacity && v.color && v.price)
          .map((v) =>
            createVariant(product.id, {
              capacity: v.capacity,
              color: v.color,
              price: parseFloat(v.price),
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              battery_condition: isOpenBox && v.battery_condition ? parseInt(v.battery_condition) : null,
            })
          )
      );
      await setProductGifts(product.id, giftsEnabled && giftProductId ? [{ gift_product_id: giftProductId, quantity: 1 }] : []);

      router.push("/admin/productos");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto.");
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Nuevo Producto</h1>
        <p className="text-[var(--text-secondary)] mt-1">Agrega un celular al catálogo con sus variantes.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-[var(--radius-md)] px-4 py-3 text-[14px]">
            {error}
          </div>
        )}

        {/* Product Info */}
        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-5">
          <h2 className="text-[16px] font-semibold">Información del producto</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand" className="text-[14px] font-medium">Marca</label>
              <input id="brand" name="brand" type="text" required placeholder="Samsung" className="input-field px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model" className="text-[14px] font-medium">Modelo</label>
              <input id="model" name="model" type="text" required placeholder="Galaxy S24" className="input-field px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-type" className="text-[14px] font-medium">Tipo</label>
            <select
              id="product-type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer">
            <input
              type="checkbox"
              name="allows_installments"
              defaultChecked
              className="w-5 h-5 accent-[var(--accent)]"
            />
            <span className="text-[14px] font-medium">Permitir financiamiento / cuotas con tarjeta</span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer">
              <input type="checkbox" name="is_featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-[var(--accent)]" />
              <span><span className="block text-[14px] font-medium">Mostrar en inicio</span><span className="block text-[12px] text-[var(--text-tertiary)]">Usa presentación visual destacada.</span></span>
            </label>
            <label className="flex flex-col gap-1 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]"><span className="text-[12px] font-medium">Orden destacado</span><input name="featured_order" type="number" min="0" defaultValue="100" className="w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-[14px]" /></label>
          </div>
          {isFeatured && <div className="featured-copy-fields grid gap-3 border-l-2 border-[var(--accent)] pl-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Mensaje de portada</p>
             <label className="flex flex-col gap-1 text-[12px] font-medium">Frase superior<input name="featured_eyebrow" placeholder="Ej. Rendimiento sin concesiones" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label>
             <label className="flex flex-col gap-1 text-[12px] font-medium">Titular<input name="featured_headline" placeholder="Titular personalizado (opcional)" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label>
             <label className="flex flex-col gap-1 text-[12px] font-medium">Descripción<textarea name="featured_description" rows={3} placeholder="Describe por qué este equipo merece atención." className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label>
             <label className="flex flex-col gap-1 text-[12px] font-medium">Texto del botón<input name="featured_cta" placeholder="Ej. Ver iPhone 17 Pro Max" className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[14px]" /></label>
          </div>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-image" className="text-[14px] font-medium">Imagen (opcional)</label>
            <input
              id="product-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="text-[14px] file:mr-3 file:px-3 file:py-1.5 file:rounded-[var(--radius-sm)] file:border file:border-[var(--border-strong)] file:bg-[var(--surface)] file:text-[var(--text-primary)] file:cursor-pointer"
            />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Vista previa"
                className="mt-2 max-h-40 rounded-[var(--radius-md)] border border-[var(--border)] object-contain bg-[var(--bg-secondary)]"
              />
            )}
          </div>
        </section>

        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-4">
          <label className="flex items-center gap-3 text-[14px] font-medium"><input type="checkbox" checked={giftsEnabled} onChange={(event) => setGiftsEnabled(event.target.checked)} className="h-5 w-5 accent-[var(--accent)]" /> Este producto incluye un regalo</label>
          {giftsEnabled && <div className="flex flex-col gap-2"><p className="text-[12px] text-[var(--text-tertiary)]">Busca un producto existente con stock disponible.</p><input value={giftSearch} onChange={(event) => setGiftSearch(event.target.value)} placeholder="Buscar producto regalo..." className="input-apple" /><select required value={giftProductId} onChange={(event) => setGiftProductId(event.target.value)} className="input-apple"><option value="">Selecciona un producto</option>{productOptions.filter((option) => `${option.brand} ${option.model}`.toLowerCase().includes(giftSearch.toLowerCase()) && (option.product_variants ?? []).some((variant) => variant.stock > 0)).map((option) => <option key={option.id} value={option.id}>{option.brand} {option.model}</option>)}</select></div>}
        </section>

        {/* Variants */}
        <section className="card-apple p-6 hover:!transform-none flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Variantes</h2>
            <button
              type="button"
              onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
              className="text-[13px] text-[var(--accent)] hover:underline font-medium"
            >
              + Agregar variante
            </button>
          </div>

          {variants.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-3 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] relative"
            >
              <p className="col-span-2 text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Variante {i + 1}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium">Capacidad</label>
                <input type="text" value={v.capacity} onChange={(e) => updateVariant(i, "capacity", e.target.value)} placeholder="128GB" className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium">Color</label>
                <input type="text" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} placeholder="Negro" className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium">Precio (USD)</label>
                <input type="number" min="0" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} placeholder="799.00" className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium">Stock</label>
                <input type="number" min="0" step="1" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} placeholder="0" className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>

              {isOpenBox && (
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium">Batería (%)</label>
                  <input type="number" min="0" max="100" value={v.battery_condition} onChange={(e) => updateVariant(i, "battery_condition", e.target.value)} placeholder="89" className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
              )}

              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-3 right-3 text-[12px] text-[var(--status-red)] hover:underline"
                  aria-label={`Eliminar variante ${i + 1}`}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" id="save-product" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar Producto"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
