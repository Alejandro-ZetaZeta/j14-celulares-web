import type { CatalogCollection, ProductWithVariants } from "@/types/database";

export interface CatalogChip {
  slug: string;
  label: string;
}

export const normalize = (value: string | null | undefined) =>
  (value ?? "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function collectionMatches(product: ProductWithVariants, collection: CatalogCollection) {
  const value = normalize(collection.match_value);
  switch (collection.match_type) {
    case "all": return true;
    case "product_type": return normalize(product.type) === value;
    case "brand_eq": return normalize(product.brand) === value;
    case "model_contains": return normalize(product.model).includes(value);
  }
}

export function productMatchesCollection(
  product: ProductWithVariants,
  collection: CatalogCollection | undefined,
) {
  return !collection || collectionMatches(product, collection);
}

export function getCatalogChips(
  products: ProductWithVariants[],
  collections: CatalogCollection[],
): CatalogChip[] {
  const chips: CatalogChip[] = [{ slug: "all", label: "Todos" }];
  const available = collections.filter((collection) =>
    collection.show_as_chip && products.some((product) => collectionMatches(product, collection)),
  );
  const seen = new Set(chips.map((chip) => chip.slug));
  for (const collection of available) {
    if (!seen.has(collection.slug)) {
      chips.push({ slug: collection.slug, label: collection.label });
      seen.add(collection.slug);
    }
  }

  const brands = [...new Set(products.map((product) => product.brand))].sort((a, b) => a.localeCompare(b));
  for (const brand of brands) {
    const slug = `brand:${normalize(brand).replace(/\s+/g, "-")}`;
    if (!seen.has(slug)) {
      chips.push({ slug, label: brand });
      seen.add(slug);
    }
  }
  return chips;
}

export function sortProducts(products: ProductWithVariants[], sort: string) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc" || sort === "price-desc") {
      const price = (product: ProductWithVariants) => Math.min(...product.product_variants.map((variant) => variant.price));
      return (price(a) - price(b)) * (sort === "price-asc" ? 1 : -1);
    }
    if (sort === "name") return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
