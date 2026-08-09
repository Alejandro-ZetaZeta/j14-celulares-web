import { Suspense } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ProductCard from "@/components/ui/ProductCard";
import SubcategoryFilter from "./SubcategoryFilter";
import type { ProductWithVariants } from "@/types/database";

interface Subcategory {
  id: string;
  label: string;
  match: (model: string, type: string, brand: string) => boolean;
}

interface CatalogSectionProps {
  title: string;
  subtitle: string;
  accentClass: string;
  products: ProductWithVariants[];
  subcategories: Subcategory[];
  activeId: string;
  seccion: string;
}

// Server Component — no 'use client'. Renders product cards on the server.
// Only SubcategoryFilter (the chips) is a client island.
export default function CatalogSection({
  title,
  subtitle,
  accentClass,
  products,
  subcategories,
  activeId,
  seccion,
}: CatalogSectionProps) {
  const active = subcategories.find((s) => s.id === activeId) ?? subcategories[0];
  const filtered = products.filter((p) =>
    active.match(p.model, p.type, p.brand)
  );

  // Strip the match function before passing subcategories to the client component
  // (functions are not serializable across the RSC → client boundary)
  const clientSubs = subcategories.map(({ id, label }) => ({ id, label }));

  return (
    <section
      id={`section-${title.toLowerCase()}`}
      className="section-gray border-b border-[var(--border)]"
    >
      <div className="container-wide py-12">
        <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className={`text-headline ${accentClass}`}>{title}</h2>
            <p className="text-body text-[var(--text-secondary)] mt-1">{subtitle}</p>
          </div>
          <span className="text-caption">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          </span>
        </header>

        {/* Subcategory filter chips — client island wrapped in Suspense
            (required because SubcategoryFilter uses useSearchParams) */}
        <div className="mb-5">
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-2">
                {clientSubs.map((sub) => (
                  <span key={sub.id} className="chip">{sub.label}</span>
                ))}
              </div>
            }
          >
            <SubcategoryFilter
              subcategories={clientSubs}
              activeId={activeId}
              seccion={seccion}
            />
          </Suspense>
        </div>

        {/* Product grid — fully server-rendered */}
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-body text-[var(--text-tertiary)]">
              Sin stock en esta subcategoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <AnimatedSection key={product.id} delay={i * 0.04}>
                <ProductCard product={product} />
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
