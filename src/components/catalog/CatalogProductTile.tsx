import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/types/database";

function price(product: ProductWithVariants) {
  return Math.min(...product.product_variants.map((variant) => variant.price));
}

export default function CatalogProductTile({ product }: { product: ProductWithVariants }) {
  const stock = product.product_variants.reduce((sum, variant) => sum + variant.stock, 0);
  const isOpenBox = product.type === "open_box_iphone";
  return (
    <article className="catalog-tile group">
      <Link href={`/catalogo/${product.id}`} className="block" aria-label={`Ver ${product.brand} ${product.model}`}>
        <div className="catalog-tile-image">
          {product.image_url ? (
            <Image src={product.image_url} alt={`${product.brand} ${product.model}`} fill className="object-contain p-5 transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="12" fill="currentColor" opacity=".18" /><path d="M16 17h16v14H16z" stroke="currentColor" strokeWidth="2" /><path d="m18 28 4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
          )}
          <span className={`catalog-stock ${stock <= 2 ? "catalog-stock-low" : ""}`}>{stock <= 2 ? "Últimas unidades" : "Disponible"}</span>
        </div>
        <div className="p-4">
          <p className="catalog-brand">{product.brand}</p>
          <h2 className="mt-1 min-h-[2.75rem] text-[15px] font-semibold leading-5 text-[var(--text-primary)]">{product.model}</h2>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div><p className="text-[11px] text-[var(--text-tertiary)]">Desde</p><p className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">${price(product).toLocaleString("en-US")}</p></div>
            {isOpenBox ? <span className="catalog-badge">Open Box</span> : product.type === "sealed_iphone" ? <span className="catalog-badge">Sellado</span> : <span className="catalog-badge">Android</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
