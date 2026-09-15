"use client";

import type { ProductWithVariants, ProductVariant } from "@/types/database";
import { useCart } from "@/components/cart/CartProvider";
import { buildCartItem } from "@/lib/cart";

export default function AddToCartButton({ product, variant }: { product: ProductWithVariants; variant: ProductVariant }) {
  const { addToCart } = useCart();
  const disabled = variant.stock < 1;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addToCart(buildCartItem(product, variant))}
      className="btn-primary w-full justify-center text-center disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Agregar ${product.brand} ${product.model} al carrito`}
    >
      {disabled ? "Sin stock" : "Agregar al Carrito"}
    </button>
  );
}