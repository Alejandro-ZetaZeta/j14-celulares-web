import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalogCollections, getProducts } from "@/lib/data/catalog";
import { collectionMatches, getCatalogChips, normalize, sortProducts } from "@/lib/catalog-filters";
import CatalogToolbar from "./CatalogToolbar";
import CatalogProductTile from "@/components/catalog/CatalogProductTile";

export const metadata: Metadata = {
  title: "Catálogo de Celulares — J14 Celulares",
  description: "Explora smartphones disponibles en J14 Celulares. Stock actualizado en tiempo real.",
};

interface PageProps { searchParams: Promise<{ q?: string; coleccion?: string; brand?: string; model?: string; orden?: string }> }

async function CatalogContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const [products, collections] = await Promise.all([getProducts(), getCatalogCollections()]);
  const collection = collections.find((item) => item.slug === params.coleccion);
  const q = normalize(params.q);
  const brand = normalize(params.brand);
  const model = normalize(params.model);
  const dynamicBrandSlug = params.coleccion?.startsWith("brand:") ? params.coleccion.slice(6) : "";
  const dynamicBrand = products.find((product) => `brand:${normalize(product.brand).replace(/\s+/g, "-")}` === dynamicBrandSlug)?.brand ?? "";
  const filtered = sortProducts(products.filter((product) => {
    const text = normalize(`${product.brand} ${product.model}`);
    const matchesCollection = collection ? collectionMatches(product, collection) : (!dynamicBrand || normalize(product.brand) === normalize(dynamicBrand));
    return matchesCollection &&
      (!q || text.includes(q)) &&
      (!brand || normalize(product.brand) === brand) &&
      (!model || normalize(product.model) === model);
  }), params.orden ?? "newest");
  const chips = getCatalogChips(products, collections);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <section className="catalog-intro">
        <div className="container-wide">
          <p className="catalog-kicker">J14 Celulares / tienda</p>
          <h1 className="text-display">Encuentra tu próximo equipo.</h1>
          <p className="mt-3 max-w-xl text-body-lg text-[var(--text-secondary)]">Modelos seleccionados, stock real y opciones para cada forma de comprar.</p>
        </div>
      </section>
      <section className="container-wide py-7 lg:py-10">
        <Suspense fallback={null}><CatalogToolbar chips={chips} count={filtered.length} /></Suspense>
        {filtered.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {filtered.map((product) => <CatalogProductTile key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-20 text-center"><p className="text-[17px] font-semibold">No encontramos equipos</p><p className="mt-2 text-[14px] text-[var(--text-secondary)]">Prueba otra búsqueda o elimina algún filtro.</p></div>
        )}
      </section>
    </main>
  );
}

export default function CatalogoPage({ searchParams }: PageProps) {
  return <Suspense fallback={<div className="min-h-screen p-12 text-[var(--text-tertiary)]">Cargando catálogo...</div>}><CatalogContent searchParams={searchParams} /></Suspense>;
}
