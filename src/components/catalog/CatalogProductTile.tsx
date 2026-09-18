"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/types/database";
import { useCart } from "@/components/cart/CartProvider";
import { buildCartItem } from "@/lib/cart";
import { getProductDisplayName } from "@/lib/product-display";

function minPrice(product: ProductWithVariants) {
  return Math.min(...product.product_variants.map((variant) => variant.price));
}

export default function CatalogProductTile({ product, whatsappNumber }: { product: ProductWithVariants; whatsappNumber: string }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const stock = product.product_variants.reduce((sum, variant) => sum + variant.stock, 0);
  const variant = product.product_variants.find((candidate) => candidate.stock > 0);
  const disabled = !variant;
  const price = minPrice(product);
  const displayName = getProductDisplayName(product);

  function handleAdd() {
    if (!variant) return;
    addToCart(buildCartItem(product, variant));
    setAdded(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="catalog-tile">
      <Link
        href={`/catalogo/${product.id}`}
        className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={`Ver ${product.brand} ${product.model}`}
      >
        <div className="catalog-tile-image">
          {product.image_url ? (
            <Image src={product.image_url} alt={`${product.brand} ${product.model}`} fill className="catalog-tile-image-img object-contain p-5" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-text-tertiary">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="12" fill="currentColor" opacity=".18" /><path d="M16 17h16v14H16z" stroke="currentColor" strokeWidth="2" /><path d="m18 28 4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
          )}
          <span className={`catalog-stock ${stock <= 2 ? "catalog-stock-low" : ""}`}>{stock <= 2 ? "Últimas unidades" : "Disponible"}</span>
        </div>
        <div className="px-4 pt-4">
          <p className="catalog-brand">{product.brand}</p>
          <h2 className="mt-1 min-h-11 text-[15px] font-semibold leading-5 text-foreground">{product.model}</h2>
        </div>
      </Link>
      <div className="catalog-tile-price-row">
        <Link
          href={`/catalogo/${product.id}`}
          className="min-w-0 block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={`Ver ${product.brand} ${product.model} — desde $${price.toLocaleString("en-US")}`}
        >
          <p className="text-[11px] text-text-tertiary">Desde</p>
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-foreground">${price.toLocaleString("en-US")}</p>
        </Link>
        <div className="catalog-tile-actions">
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled}
                data-added={added || undefined}
                className="catalog-tile-btn"
                title={disabled ? "Sin stock" : "Agregar al carrito"}
                aria-label={`Agregar ${product.brand} ${product.model} al carrito`}
              >
                <span className="catalog-tile-btn--idle">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                </span>
                <span className="catalog-tile-btn--done">
                  <svg className="catalog-tile-btn-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5" pathLength={1} /></svg>
                </span>
              </button>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola Celulares J14, me interesa ${displayName} ($${price.toFixed(2)}). ¿Tienen stock disponible?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="catalog-tile-whatsapp"
                title="Pedir por WhatsApp"
                aria-label={`Consultar ${product.brand} ${product.model} por WhatsApp`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.83 14.12c-.25.7-1.45 1.33-2.02 1.38-.51.05-1.16.24-3.9-.81-3.3-1.28-5.4-4.57-5.56-4.78-.16-.21-1.33-1.77-1.33-3.38 0-1.61.84-2.4 1.14-2.73.3-.33.65-.41.87-.41s.43.01.62.01c.2 0 .47-.07.73.56.27.65.92 2.24 1 2.4.08.16.13.35.03.57-.11.22-.16.35-.32.54-.16.19-.34.43-.49.57-.16.16-.33.34-.14.67.19.32.84 1.39 1.81 2.25 1.24 1.11 2.29 1.45 2.61 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.03-1.27.21-.32.43-.27.72-.16.3.11 1.89.89 2.21 1.05.32.16.54.24.62.38.08.13.08.78-.17 1.47Z" /></svg>
              </a>
            </div>
      </div>
    </article>
  );
}