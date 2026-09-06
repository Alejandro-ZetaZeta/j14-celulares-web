export interface GiftItem {
  productId: string;
  variantId: string;
  brand: string;
  model: string;
  capacity: string;
  color: string;
  quantity: number;
}

export interface CartItem {
  variantId: string;
  productId: string;
  brand: string;
  model: string;
  capacity: string;
  color: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
  gifts: GiftItem[];
}

export interface CartTotals {
  subtotalBase0: number;
  subtotalBase15: number;
  ivaAmount: number;
  total: number;
  discount: number;
  promotionCode: string | null;
}
