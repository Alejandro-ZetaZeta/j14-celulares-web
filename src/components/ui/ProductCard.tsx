import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/types/database";

// Server Component — no 'use client', no JS shipped for this card.
// Hover animation is pure CSS (see globals.css .card-apple).

interface ProductCardProps {
  product: ProductWithVariants;
  eager?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  android: "Android",
  sealed_iphone: "iPhone Sellado",
  open_box_iphone: "iPhone Open Box",
};

function getMinPrice(product: ProductWithVariants): number | null {
  if (!product.product_variants?.length) return null;
  return Math.min(...product.product_variants.map((v) => v.price));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({ product, eager = false }: ProductCardProps) {
  const minPrice = getMinPrice(product);
  const totalStock = product.product_variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const typeLabel = TYPE_LABELS[product.type] ?? product.type;
  const isOpenBox = product.type === "open_box_iphone";

  // Battery condition range for Open Box
  const batteryValues = isOpenBox
    ? product.product_variants
        .map((v) => v.battery_condition)
        .filter((b): b is number => b !== null)
    : [];
  const minBattery = batteryValues.length ? Math.min(...batteryValues) : null;

  return (
    <article className="card-apple card-apple--hover group">
      <Link
        href={`/catalogo/${product.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 rounded-[var(--radius-lg)]"
        aria-label={`Ver ${product.brand} ${product.model}`}
      >
        {/* Image Area */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
          {product.image_url ? (
            product.image_key ? (
              <Image
                src={product.image_url}
                alt={`${product.brand} ${product.model}`}
                fill
                loading={eager ? "eager" : "lazy"}
                className="object-contain p-6 card-apple--img"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              // Legacy: pre-bucket external URL — fall back to plain <img>
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={`${product.brand} ${product.model}`}
                className="absolute inset-0 w-full h-full object-contain p-6 card-apple--img"
              />
            )
          ) : (
            /* Apple-style gradient placeholder */
            <div className="img-placeholder w-full h-full p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 opacity-40">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <rect width="48" height="48" rx="10" fill="#98989D" />
                  <path d="M24 12c6.627 0 12 5.373 12 12s-5.373 12-12 12S12 30.627 12 24 17.373 12 24 12zm0 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10A5 5 0 0 1 24 19z" fill="#fff"/>
                </svg>
                <span className="text-[11px] font-medium text-[#98989D]">Sin imagen</span>
              </div>
            </div>
          )}

          {/* Type badge */}
          <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
            {typeLabel}
          </span>

          {/* Open Box battery badge */}
          {isOpenBox && minBattery !== null && (
            <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--status-green)]/90 text-white backdrop-blur-sm">
              🔋 {minBattery}%+
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5">
          <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            {product.brand}
          </p>
          <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-1 leading-tight">
            {product.model}
          </h3>

          {minPrice !== null && (
            <p className="text-[15px] text-[var(--text-secondary)] mb-3">
              Desde{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {formatPrice(minPrice)}
              </span>
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-tertiary)]">
              {totalStock} {totalStock === 1 ? "unidad" : "unidades"} disponibles
            </span>
            <span className="text-[13px] font-medium text-[var(--accent)] group-hover:underline">
              Ver opciones →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
