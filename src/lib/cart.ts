import type { ProductWithVariants, ProductVariant } from "@/types/database";
import type { CartItem, CartTotals } from "@/types/cart";

export const IVA_RATE = 0.15;

export function buildCartItem(product: ProductWithVariants, variant: ProductVariant): CartItem {
  const gifts = (product.product_gifts ?? []).map((gift) => {
    const giftProduct = Array.isArray(gift.gift_product) ? gift.gift_product[0] : gift.gift_product;
    const giftVariant = giftProduct?.product_variants?.find((candidate) => candidate.stock > 0);
    if (!giftVariant || !giftProduct) return null;
    return { productId: giftProduct.id, variantId: giftVariant.id, brand: giftProduct.brand, model: giftProduct.model, capacity: giftVariant.capacity, color: giftVariant.color, quantity: gift.quantity };
  }).filter((gift): gift is NonNullable<typeof gift> => Boolean(gift));

  return {
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
  };
}

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeCartTotals(items: CartItem[], ivaRate = IVA_RATE, discount = 0, promotionCode: string | null = null): CartTotals {
  // unitPrice is the catalog price (IVA-inclusive). We back-calculate the pre-tax base.
  const totalWithIva = roundCents(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  // Use totalWithIva as the total so it matches the catalog price exactly.
  const appliedDiscount = roundCents(Math.min(Math.max(discount, 0), totalWithIva));
  const total = roundCents(totalWithIva - appliedDiscount);

  const discountedBase15 = roundCents(total / (1 + ivaRate));
  return { subtotalBase0: 0, subtotalBase15: discountedBase15, ivaAmount: roundCents(discountedBase15 * ivaRate), total, discount: appliedDiscount, promotionCode };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
