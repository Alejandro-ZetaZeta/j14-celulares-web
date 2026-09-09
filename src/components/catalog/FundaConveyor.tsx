import Image from "next/image";
import type { ProductWithVariants } from "@/types/database";
import { getProductDisplayName } from "@/lib/product-display";

interface FundaConveyorProps {
  products: ProductWithVariants[];
  whatsappNumber: string;
}

function price(product: ProductWithVariants) {
  return Math.min(...product.product_variants.map((variant) => variant.price));
}

export default function FundaConveyor({ products, whatsappNumber }: FundaConveyorProps) {
  // Strict filter — only products typed as a case ("Funda" / "funda").
  const fundas = products.filter((p) => p.type.toLowerCase().includes("funda"));

  if (fundas.length === 0) return null;

  // Replicate the set several times so the track always fills the viewport
  // width (no blank gap on wide screens) while translateX(-50%) still loops
  // seamlessly on an even number of copies.
  const conveyorItems = Array.from({ length: 4 }, () => fundas).flat();

  return (
    <section className="relative w-full overflow-hidden py-6" aria-label="Pasarela de fundas y protección">
      <div className="relative w-full conveyor-track">
        {/* Portal Izquierdo — pegado al borde izquierdo de pantalla */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-secondary)]/85 to-transparent sm:w-24" aria-hidden="true" />

        {/* Portal Derecho — pegado al borde derecho de pantalla */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[var(--bg-secondary)] via-[var(--bg-secondary)]/85 to-transparent sm:w-24" aria-hidden="true" />

        {/* Track */}
        <div className="animate-conveyor py-2">
          {conveyorItems.map((funda, index) => (
            <article
              key={`${funda.id}-${index}`}
              className="group mr-4 w-[220px] shrink-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] sm:w-[250px]"
            >
              <div className="relative mb-3 flex h-32 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[linear-gradient(145deg,var(--bg-secondary),var(--surface))]">
                {funda.image_url ? (
                  <Image
                    src={funda.image_url}
                    alt={`${funda.brand} ${funda.model}`}
                    fill
                    sizes="(max-width: 640px) 220px, 250px"
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
                    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="12" fill="currentColor" opacity=".18" /><path d="M16 17h16v14H16z" stroke="currentColor" strokeWidth="2" /><path d="m18 28 4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="2" /></svg>
                  </div>
                )}
              </div>

              <p className="catalog-brand">{funda.brand}</p>
              <h3 className="mt-1 truncate text-[15px] font-semibold text-[var(--text-primary)]">
                {getProductDisplayName(funda)}
              </h3>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Desde</p>
                  <p className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    ${price(funda).toLocaleString("en-US")}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hola Celulares J14, me interesa la ${getProductDisplayName(funda)} ($${price(funda).toFixed(2)}). ¿Tienen stock disponible?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-95"
                >
                  Pedir Funda
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}