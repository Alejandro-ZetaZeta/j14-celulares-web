"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface CatalogToolbarProps {
  chips: { slug: string; label: string }[];
  count: number;
}

export default function CatalogToolbar({ chips, count }: CatalogToolbarProps) {
  const params = useSearchParams();
  const router = useRouter();
  const active = params.get("coleccion") ?? "all";
  const query = params.get("q") ?? "";
  const sort = params.get("orden") ?? "newest";

  function href(values: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/catalogo${next.toString() ? `?${next.toString()}` : ""}`;
  }

  return (
    <div className="catalog-toolbar">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="catalog-search flex items-center gap-3" htmlFor="catalog-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input id="catalog-search" name="q" defaultValue={query} placeholder="Buscar marca o modelo" form="catalog-search-form" />
        </label>
        <form id="catalog-search-form" action="/catalogo" className="hidden">
          {(["coleccion", "brand", "model", "orden"] as const).map((key) => {
            const value = params.get(key);
            return value ? <input key={key} type="hidden" name={key} value={value} /> : null;
          })}
        </form>
        <div className="flex items-center justify-between gap-4 text-[13px] text-[var(--text-secondary)]">
          <span>{count} {count === 1 ? "producto" : "productos"}</span>
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Ordenar</span>
             <select defaultValue={sort} onChange={(event) => { router.push(href({ orden: event.target.value })); }} className="bg-transparent font-medium text-[var(--text-primary)] focus:outline-none">
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
              <option value="name">Nombre</option>
            </select>
          </label>
        </div>
      </div>
      <div className="catalog-chip-row" aria-label="Filtrar catálogo">
        {chips.map((chip) => (
          <Link key={chip.slug} href={href({ coleccion: chip.slug === "all" ? null : chip.slug })} className={`chip ${active === chip.slug || (chip.slug === "all" && !params.get("coleccion")) ? "active" : ""}`}>
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
