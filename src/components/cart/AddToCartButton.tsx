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
       onClick={() => {
         const gifts = (product.product_gifts ?? []).map((gift) => {
           const giftProduct = Array.isArray(gift.gift_product) ? gift.gift_product[0] : gift.gift_product;
           const giftVariant = giftProduct?.product_variants?.find((candidate) => candidate.stock > 0);
           if (!giftVariant || !giftProduct) return null;
           return { productId: giftProduct.id, variantId: giftVariant.id, brand: giftProduct.brand, model: giftProduct.model, capacity: giftVariant.capacity, color: giftVariant.color, quantity: gift.quantity };
         }).filter((gift): gift is NonNullable<typeof gift> => Boolean(gift));
         addToCart({
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
        gifts,
         });
       }}
      className="btn-primary w-full justify-center text-center disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Agregar ${product.brand} ${product.model} al carrito`}
    >
      {disabled ? "Sin stock" : "Agregar al Carrito"}
    </button>
  );
}
