"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { CartItem, CartTotals } from "@/types/cart";
import { computeCartTotals } from "@/lib/cart";
import CartDrawer from "@/components/cart/CartDrawer";

interface CartContextValue {
  items: CartItem[];
  totals: CartTotals;
  ivaRate: number;
  itemCount: number;
  open: boolean;
  addToCart: (item: CartItem, quantity?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  promotionCode: string;
  promotionError: string;
  applyingPromotion: boolean;
  applyPromotion: (code: string) => Promise<void>;
  removePromotion: () => void;
}

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "quantity"; variantId: string; quantity: number }
  | { type: "clear" };

function reducer(items: CartItem[], action: Action): CartItem[] {
  if (action.type === "hydrate") return action.items;
  if (action.type === "clear") return [];
  if (action.type === "remove") return items.filter((item) => item.variantId !== action.variantId);

  if (action.type === "quantity") {
    if (action.quantity <= 0) return items.filter((item) => item.variantId !== action.variantId);
    return items.map((item) => item.variantId === action.variantId
      ? { ...item, quantity: Math.min(action.quantity, item.stock) }
      : item);
  }

  const existing = items.find((item) => item.variantId === action.item.variantId);
  if (existing) {
    return items.map((item) => item.variantId === action.item.variantId
      ? { ...item, quantity: Math.min(item.stock, item.quantity + action.quantity) }
      : item);
  }
  return [...items, { ...action.item, quantity: Math.min(action.item.stock, action.quantity) }];
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "webj14-cart";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.variantId === "string" && typeof item.productId === "string" && typeof item.unitPrice === "number"
    && typeof item.quantity === "number" && item.quantity > 0 && typeof item.stock === "number" && item.stock > 0;
}

export default function CartProvider({ children, initialTaxRate = 15 }: { children: React.ReactNode; initialTaxRate?: number }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionError, setPromotionError] = useState("");
  const [applyingPromotion, setApplyingPromotion] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", items: parsed.filter(isCartItem).map((item) => ({ ...item, quantity: Math.min(item.quantity, item.stock) })) });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totals: computeCartTotals(items, initialTaxRate / 100, promotionDiscount, promotionCode || null),
    ivaRate: initialTaxRate,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    open,
    addToCart: (item, quantity = 1) => { dispatch({ type: "add", item, quantity }); setOpen(true); },
    removeFromCart: (variantId) => dispatch({ type: "remove", variantId }),
    updateQuantity: (variantId, quantity) => dispatch({ type: "quantity", variantId, quantity }),
    clearCart: () => dispatch({ type: "clear" }),
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    promotionCode,
    promotionError,
    applyingPromotion,
    applyPromotion: async (code) => {
      setApplyingPromotion(true);
      setPromotionError("");
      try {
        const response = await fetch("/api/promotions/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) }) });
        const result = await response.json() as { discount?: number; code?: string; error?: string };
        if (!response.ok || !result.code) throw new Error(result.error ?? "Código inválido.");
        setPromotionCode(result.code);
        setPromotionDiscount(Number(result.discount ?? 0));
      } catch (error) {
        setPromotionCode("");
        setPromotionDiscount(0);
        setPromotionError(error instanceof Error ? error.message : "Código inválido.");
      } finally { setApplyingPromotion(false); }
    },
    removePromotion: () => { setPromotionCode(""); setPromotionDiscount(0); setPromotionError(""); },
  }), [items, open, initialTaxRate, promotionDiscount, promotionCode, promotionError, applyingPromotion]);

  return <CartContext.Provider value={value}>{children}<CartDrawer /></CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
