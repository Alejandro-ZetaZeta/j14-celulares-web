"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ConfirmationClient() {
  const orderId = useSearchParams().get("orden");
  return <main className="container-wide flex min-h-[70vh] items-center justify-center px-5 py-28"><div className="max-w-xl text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div><p className="catalog-kicker mt-7">Pago aprobado</p><h1 className="text-display mt-2">Compra confirmada</h1><p className="mt-4 text-[15px] leading-6 text-[var(--text-secondary)]">Recibimos tu pago y registramos tu orden. Conserva este identificador para futuras consultas.</p>{orderId && <p className="mt-5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-3 font-mono text-[13px] text-[var(--text-primary)]">Orden: {orderId}</p>}<Link href="/catalogo" className="btn-primary mt-7 inline-flex">Seguir comprando</Link></div></main>;
}
