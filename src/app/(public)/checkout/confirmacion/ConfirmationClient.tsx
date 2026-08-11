"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

export default function ConfirmationClient() {
  const orderId = useSearchParams().get("orden");
  const { clearCart } = useCart();
  const [status, setStatus] = useState("PENDING");
  const [error, setError] = useState("");
  const cleared = useRef(false);
  useEffect(() => {
    if (!orderId) return;
    let active = true;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      if (attempts > 120) { setError("La verificación tardó demasiado. Puedes volver más tarde para consultar tu orden."); return; }
      try {
        const response = await fetch(`/api/payments/pagomedios-status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const result = await response.json() as { status?: string; error?: string };
        if (!response.ok) throw new Error(result.error ?? "No se pudo consultar la orden.");
        if (active && result.status) { setStatus(result.status); if (result.status === "APPROVED" && !cleared.current) { cleared.current = true; clearCart(); } }
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "No se pudo consultar la orden."); }
    };
    void check();
    const timer = window.setInterval(() => void check(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [clearCart, orderId]);
  const approved = status === "APPROVED";
  const rejected = ["REJECTED", "CANCELLED"].includes(status);
  return <main className="container-wide flex min-h-[70vh] items-center justify-center px-5 py-28"><div className="max-w-xl text-center"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${approved ? "bg-green-100 text-green-700" : rejected ? "bg-red-100 text-red-700" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>{approved ? "✓" : rejected ? "!" : "…"}</div><p className="catalog-kicker mt-7">{approved ? "Pago aprobado" : rejected ? "Pago no aprobado" : "Pago pendiente"}</p><h1 className="text-display mt-2">{approved ? "Compra confirmada" : rejected ? "No pudimos confirmar el pago" : "Estamos verificando tu pago"}</h1><p className="mt-4 text-[15px] leading-6 text-[var(--text-secondary)]">{approved ? "Recibimos tu pago y registramos tu orden." : rejected ? "Puedes volver al catálogo e intentarlo nuevamente." : "Pagomedios todavía no ha enviado una autorización. Esta página se actualizará automáticamente."}</p>{error && <p role="alert" className="mt-5 text-[13px] text-[var(--status-red)]">{error}</p>}{orderId && <p className="mt-5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-3 font-mono text-[13px] text-[var(--text-primary)]">Orden: {orderId}</p>}<Link href="/catalogo" className="btn-primary mt-7 inline-flex">Seguir comprando</Link></div></main>;
}
