import type { Product } from "@/types/database";

/** Avoid repeating the category/brand when it is already part of the model name. */
export function getProductDisplayName(product: Pick<Product, "brand" | "model">) {
  if (product.brand.toLowerCase() === "iphone") return product.model;
  return `${product.brand} ${product.model}`;
}
