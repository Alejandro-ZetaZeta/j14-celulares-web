"use client";

import { useCart } from "@/components/cart/CartProvider";

export default function CartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
      aria-label={`Abrir carrito${itemCount ? `, ${itemCount} productos` : ""}`}
      title="Carrito"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5h2l1.5 10.5h10L20 8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="19" r="1.25" fill="currentColor" /><circle cx="17" cy="19" r="1.25" fill="currentColor" />
      </svg>
      {itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">{itemCount > 99 ? "99+" : itemCount}</span>}
    </button>
  );
}
