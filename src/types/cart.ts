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
}

export interface CartTotals {
  subtotalBase0: number;
  subtotalBase15: number;
  ivaAmount: number;
  total: number;
}
