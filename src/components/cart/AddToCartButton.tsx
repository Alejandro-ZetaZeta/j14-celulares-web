"use client";

import type { ProductWithVariants, ProductVariant } from "@/types/database";
import { useCart } from "@/components/cart/CartProvider";

export default function AddToCartButton({ product, variant }: { product: ProductWithVariants; variant: ProductVariant }) {
  const { addToCart } = useCart();
  const disabled = variant.stock < 1;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addToCart({
        variantId: variant.id,
        productId: product.id,
        brand: product.brand,
        model: product.model,
        capacity: variant.capacity,
        color: variant.color,
        unitPrice: variant.price,
        imageUrl: product.image_url,
        quantity: 1,
        stock: variant.stock,
      })}
      className="btn-primary w-full justify-center text-center disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Agregar ${product.brand} ${product.model} al carrito`}
    >
      {disabled ? "Sin stock" : "Agregar al Carrito"}
    </button>
  );
}
