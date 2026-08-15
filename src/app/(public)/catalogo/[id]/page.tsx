import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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

        {(product.product_gifts ?? []).length > 0 && (
          <section
            className="mt-10 rounded-[var(--radius-xl)] border border-[var(--accent)]/20 bg-[var(--accent-light)] p-6"
            aria-label="Regalos incluidos"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Incluido con tu compra</p>
            <h2 className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">Regalos incluidos</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(product.product_gifts ?? []).map((gift) => {
                const giftProduct = Array.isArray(gift.gift_product) ? gift.gift_product[0] : gift.gift_product;
                if (!giftProduct) return null;
                const giftName = getProductDisplayName(giftProduct);

                return (
                  <li key={gift.gift_product_id}>
                    <Link
                      href={`/catalogo/${giftProduct.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--accent)]/15 bg-white/70 p-3 text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-secondary)]">
                        {giftProduct.image_url ? (
                          giftProduct.image_key ? (
                            <Image src={giftProduct.image_url} alt={giftName} fill sizes="64px" className="object-contain p-1" />
                          ) : (
                            // Legacy external URLs are not configured for next/image.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={giftProduct.image_url} alt={giftName} className="h-full w-full object-contain p-1" />
                          )
                        ) : (
                          <span className="flex h-full items-center justify-center text-[10px] text-[var(--text-tertiary)]">Sin imagen</span>
                        )}
                      </div>
                      <span className="min-w-0 text-[14px] font-medium">
                        x {gift.quantity}  {giftName}
                        <span className="mt-1 block text-[12px] font-normal text-[var(--accent)]">Ver detalles →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
