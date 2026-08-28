"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/lib/cart";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function CartDrawer() {
  const { open, closeCart, items, totals, ivaRate, removeFromCart, updateQuantity, promotionCode, promotionError, applyingPromotion, applyPromotion, removePromotion } = useCart();
  const [code, setCode] = useState("");

  return <AnimatePresence>{open && <>
    <motion.button key="cart-backdrop" type="button" aria-label="Cerrar carrito" className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} />
    <motion.aside key="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras" className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[460px] flex-col bg-[var(--surface)] shadow-[-20px_0_60px_rgba(0,0,0,0.18)]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
      <header className="flex items-start justify-between border-b border-[var(--border)] px-5 py-5">
        <div><p className="catalog-kicker">Compra segura</p><h2 className="mt-1 text-[22px] font-bold text-[var(--text-primary)]">Tu carrito</h2></div>
        <button type="button" onClick={closeCart} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[20px] text-[var(--text-secondary)] hover:bg-[var(--border)]" aria-label="Cerrar">×</button>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {items.length === 0 ? <div className="py-16 text-center"><p className="text-[16px] font-semibold text-[var(--text-primary)]">Tu carrito está vacío</p><p className="mt-2 text-[13px] text-[var(--text-secondary)]">Agrega productos desde el catálogo para comenzar.</p><Link href="/catalogo" onClick={closeCart} className="btn-primary mt-6 inline-flex">Explorar catálogo</Link></div> : <div className="space-y-4">
          {items.map((item) => <article key={item.variantId} className="flex gap-3 border-b border-[var(--border)] pb-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-secondary)]">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-contain p-2" /> : <span className="text-[11px] text-[var(--text-tertiary)]">Sin imagen</span>}</div>
            <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{item.brand}</p><h3 className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{item.model}</h3><p className="text-[12px] text-[var(--text-secondary)]">{item.capacity} · {item.color}</p></div><button type="button" onClick={() => removeFromCart(item.variantId)} className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--status-red)]" aria-label={`Eliminar ${item.model}`}>Eliminar</button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-full border border-[var(--border)]"><button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="h-7 w-7 text-[16px] text-[var(--text-secondary)]" aria-label="Reducir cantidad">−</button><span className="w-7 text-center text-[12px] font-semibold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="h-7 w-7 text-[16px] text-[var(--text-secondary)] disabled:opacity-30" aria-label="Aumentar cantidad">+</button></div><p className="text-[14px] font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p></div></div>
          </article>)}
        </div>}
      </div>
      {items.length > 0 && <footer className="border-t border-[var(--border)] bg-[var(--surface)] p-5"><div className="mb-4 flex gap-2"><input value={promotionCode || code} disabled={Boolean(promotionCode)} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Código promocional" className="input-apple min-w-0 flex-1" /><button type="button" disabled={applyingPromotion || Boolean(promotionCode)} onClick={() => void applyPromotion(code)} className="btn-secondary shrink-0 disabled:opacity-50">{applyingPromotion ? "..." : "Aplicar"}</button></div>{promotionError && <p className="mb-3 text-[12px] text-[var(--status-red)]">{promotionError}</p>}{promotionCode && <button type="button" onClick={removePromotion} className="mb-3 text-[12px] text-[var(--accent)] hover:underline">Quitar promoción</button>}<div className="space-y-2 text-[13px]"><div className="flex justify-between text-[var(--text-secondary)]"><span>Base IVA {ivaRate}%</span><span>{formatCurrency(totals.subtotalBase15)}</span></div>{totals.discount > 0 && <div className="flex justify-between text-[var(--status-green)]"><span>Descuento</span><span>-{formatCurrency(totals.discount)}</span></div>}<div className="flex justify-between text-[var(--text-secondary)]"><span>IVA {ivaRate}%</span><span>{formatCurrency(totals.ivaAmount)}</span></div><div className="mt-3 flex justify-between border-t border-[var(--border)] pt-3 text-[18px] font-bold"><span>Total</span><span>{formatCurrency(totals.total)}</span></div></div><Link href="/checkout" onClick={closeCart} className="btn-primary mt-5 flex w-full justify-center">Proceder al Pago con Dataweb</Link></footer>}
    </motion.aside>
  </>}</AnimatePresence>;
}
