import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProducts, getProductById, getCreditCardRates } from "@/lib/data/catalog";
import { getProductDisplayName } from "@/lib/product-display";
import ProductDetailClient from "./ProductDetailClient";
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
          <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-square bg-[var(--bg-secondary)]">
            {product.image_url ? (
              product.image_key ? (
                <Image
                  src={product.image_url}
                   alt={getProductDisplayName(product)}
                  fill
                  sizes="(max-width: 1023px) calc(100vw - 2.5rem), 430px"
                  className="object-contain p-10"
                  priority
                />
              ) : (
                // Legacy: pre-bucket external URL — fall back to plain <img>
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                 alt={getProductDisplayName(product)}
                  className="absolute inset-0 w-full h-full object-contain p-10"
                />
              )
            ) : (
              <div className="img-placeholder w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                    <rect width="72" height="72" rx="14" fill="#98989D" />
                    <path d="M36 18c9.941 0 18 8.059 18 18s-8.059 18-18 18S18 45.941 18 36s8.059-18 18-18zm0 6a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z" fill="#fff" />
                  </svg>
                  <span className="text-[13px] font-medium text-[#98989D]">Imagen no disponible</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Interactive configurator (client component) ──────── */}
          <ProductDetailClient product={product} rates={rates} whatsappNumber={settings.whatsappNumber} />
        </div>

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
