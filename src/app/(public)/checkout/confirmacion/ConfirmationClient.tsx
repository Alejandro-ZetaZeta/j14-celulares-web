"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function ConfirmationClient() {
  const orderId = useSearchParams().get("orden");
  const status = useSearchParams().get("estado");
  const { clearCart } = useCart();
  useEffect(() => { if (status === "ok") clearCart(); }, [clearCart, status]);
  const approved = status !== "error";
  return <main className="container-wide flex min-h-[70vh] items-center justify-center px-5 py-28"><div className="max-w-xl text-center"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{approved ? "✓" : "!"}</div><p className="catalog-kicker mt-7">{approved ? "Pago aprobado" : "Pago no aprobado"}</p><h1 className="text-display mt-2">{approved ? "Compra confirmada" : "No pudimos confirmar el pago"}</h1><p className="mt-4 text-[15px] leading-6 text-[var(--text-secondary)]">{approved ? "Recibimos tu pago y registramos tu orden." : "Dataweb no aprobo la transaccion. Puedes intentarlo nuevamente."}</p>{orderId && <p className="mt-5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-3 font-mono text-[13px]">Orden: {orderId}</p>}<Link href={approved ? "/catalogo" : "/checkout"} className="btn-primary mt-7 inline-flex">{approved ? "Seguir comprando" : "Volver al pago"}</Link></div></main>;
}
