import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getProductById, getCreditCardRates } from "@/lib/data/catalog";
import { getProductDisplayName } from "@/lib/product-display";
import ProductDetailClient from "./ProductDetailClient";
import ProductGallery from "./ProductGallery";
import { getSiteSettings } from "@/lib/site-settings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Producto no encontrado" };
  const displayName = getProductDisplayName(product);
  return {
    title: `${displayName} — J14 Celulares`,
    description: `Compra el ${displayName} en J14 Celulares. Consulta disponibilidad, capacidades y precios.`,
  };
}

async function ProductDetailContent({ params }: PageProps) {
  const { id } = await params;

  // Both queries are cached — instant on cache hit, no waterfall
  const [product, rates, settings] = await Promise.all([
    getProductById(id),
    getCreditCardRates(),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="container-apple pt-[52px] pb-40 sm:pb-24">
        {/* ── Breadcrumb (static, server-rendered) ────────────── */}
        <nav
          className="mb-8 flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]"
          aria-label="Navegación"
        >
          <Link href="/catalogo" className="hover:text-[var(--accent)] transition-colors">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">
            {getProductDisplayName(product)}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* ── Product Image (static, server-rendered) ─────────── */}
          <ProductGallery images={product.product_images ?? []} fallbackUrl={product.image_url} alt={getProductDisplayName(product)} />

          {/* ── Interactive configurator (client component) ──────── */}
          <ProductDetailClient product={product} rates={rates} whatsappNumber={settings.whatsappNumber} />
        </div>

        {(product.product_gifts ?? []).length > 0 && <section className="mt-10 rounded-[var(--radius-xl)] border border-[var(--accent)]/20 bg-[var(--accent-light)] p-6" aria-label="Regalos incluidos"><p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Incluido con tu compra</p><h2 className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">Regalos incluidos</h2><ul className="mt-4 grid gap-2 text-[15px] text-[var(--text-secondary)] sm:grid-cols-2">{(product.product_gifts ?? []).map((gift) => { const giftProduct = Array.isArray(gift.gift_product) ? gift.gift_product[0] : gift.gift_product; return giftProduct ? <li key={gift.gift_product_id}>+ {gift.quantity} × {giftProduct.brand} {giftProduct.model}</li> : null; })}</ul></section>}

        {product.featured_description && (
          <section className="mt-16 border-t border-[var(--border)] pt-10" aria-labelledby="product-description-title">
            <div className="w-full">
              <p className="catalog-kicker">Detalles del equipo</p>
              <h2 id="product-description-title" className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                Sobre este producto
              </h2>
              <p className="mt-5 whitespace-pre-line text-[16px] leading-8 text-[var(--text-secondary)]">
                {product.featured_description}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] p-10 text-[var(--text-tertiary)]">Cargando producto...</div>}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
