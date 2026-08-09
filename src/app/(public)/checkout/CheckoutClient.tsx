"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/cart";
import { openPaybox } from "@/lib/pagoplux";
import { useCart } from "@/components/cart/CartProvider";
import { insforgeBrowser } from "@/lib/insforge-browser";
import type { PayboxCustomer } from "@/types/pagoplux";

const emptyCustomer: PayboxCustomer = { fullName: "", cedula: "", email: "", phone: "", address: "" };

export default function CheckoutClient({ initialIsAuthenticated = false }: { initialIsAuthenticated?: boolean }) {
  const router = useRouter();
  const { items, totals, ivaRate, clearCart } = useCart();
  const [customer, setCustomer] = useState<PayboxCustomer>(emptyCustomer);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [guestTermsAccepted, setGuestTermsAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    void insforgeBrowser.auth.getCurrentUser().then(async ({ data }) => {
       if (!data?.user || !active) return;
       setIsAuthenticated(true);
      const user = data.user;
      const { data: profile } = await insforgeBrowser.database.from("user_profiles").select("full_name, cedula, phone, address").eq("id", user.id).maybeSingle();
      if (active && profile) setCustomer((current) => ({ ...current, fullName: profile.full_name ?? "", cedula: profile.cedula ?? "", phone: profile.phone ?? "", address: profile.address ?? "", email: user.email ?? "" }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function update(field: keyof PayboxCustomer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function proceed() {
    if (!items.length) { router.push("/catalogo"); return; }
    if (!isAuthenticated && !guestTermsAccepted) {
      setError("Lee y acepta los Términos y Condiciones y la política de devoluciones para continuar.");
      return;
    }
    if (!customer.fullName.trim() || !/^\d{10,13}$/.test(customer.cedula.trim()) || !/^\S+@\S+\.\S+$/.test(customer.email.trim()) || !customer.phone.trim() || !customer.address.trim()) {
      setError("Completa todos los datos. Cédula/RUC debe contener entre 10 y 13 dígitos.");
      return;
    }
    setError("");
    setStatus("");
    setPaying(true);
    const checkoutItems = items.map((item) => ({ ...item }));
    const checkoutTotals = { ...totals };
    const checkoutCustomer = { ...customer };
    try {
      await openPaybox(checkoutTotals, checkoutCustomer, async (pagopluxResponse) => {
        try {
          setStatus("Confirmando tu pago...");
          const response = await fetch("/api/payments/pagoplux-callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pagopluxResponse, customer: checkoutCustomer, items: checkoutItems }) });
          const result = await response.json() as { orderId?: string; error?: string };
          if (!response.ok || !result.orderId) throw new Error(result.error ?? "No se pudo registrar la orden.");
          clearCart();
          router.push(`/checkout/confirmacion?orden=${encodeURIComponent(result.orderId)}`);
        } catch (caught) {
          setPaying(false);
          setStatus("");
          setError(caught instanceof Error ? caught.message : "No se pudo registrar la orden.");
        }
      }, () => { setPaying(false); setStatus("Pago cancelado. Puedes intentarlo nuevamente."); }, (message) => setStatus(message));
    } catch (caught) {
      setPaying(false);
      setError(caught instanceof Error ? caught.message : "No se pudo abrir PagoPlux.");
    }
  }

  if (!items.length) return <main className="container-wide flex min-h-[65vh] items-center justify-center px-5 py-28"><div className="text-center"><p className="catalog-kicker">Checkout</p><h1 className="mt-2 text-display">Tu carrito está vacío</h1><Link href="/catalogo" className="btn-primary mt-6 inline-flex">Volver al catálogo</Link></div></main>;

    return <main className="container-wide px-5 pb-24 pt-28"><div className="mb-10 max-w-2xl"><p className="catalog-kicker">Checkout seguro · Sandbox</p><h1 className="text-display mt-2">Completa tu compra</h1><p className="mt-3 text-[15px] text-[var(--text-secondary)]">Ingresa tus datos para abrir el pago seguro de PagoPlux.</p></div><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"><h2 className="text-[20px] font-bold">Datos del cliente</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{([ ["fullName", "Nombre completo", "text"], ["cedula", "Cédula / RUC", "text"], ["email", "Correo electrónico", "email"], ["phone", "Teléfono", "tel"] ] as const).map(([field, label, type]) => <label key={field} className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}<input type={type} value={customer[field]} onChange={(event) => update(field, event.target.value)} className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-transparent px-3 text-[14px] font-normal text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" required /></label>)}<label className="text-[13px] font-semibold text-[var(--text-secondary)] sm:col-span-2">Dirección<input value={customer.address} onChange={(event) => update("address", event.target.value)} className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-transparent px-3 text-[14px] font-normal text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" required /></label></div>{!isAuthenticated && <label className="mt-6 flex items-start gap-2 text-[13px] leading-5 text-[var(--text-secondary)]"><input type="checkbox" checked={guestTermsAccepted} onChange={(event) => setGuestTermsAccepted(event.target.checked)} className="mt-1 accent-[var(--accent)]" /><span>Acepto los <Link href="/terminos" className="font-semibold text-[var(--accent)] underline underline-offset-2">Términos y Condiciones</Link> y la política de devoluciones.</span></label>}{error && <p role="alert" className="mt-5 rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-[13px] text-[var(--status-red)]">{error}</p>}{status && <p role="status" className="mt-5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-secondary)]">{status}</p>}<button type="button" onClick={proceed} disabled={paying || (!isAuthenticated && !guestTermsAccepted)} className="btn-primary mt-7 flex w-full justify-center disabled:cursor-wait disabled:opacity-50">{paying ? "Abriendo PagoPlux..." : "Proceder al Pago con PagoPlux"}</button></section>
     <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 sm:p-6"><h2 className="text-[18px] font-bold">Resumen de compra</h2><div className="mt-5 space-y-4">{items.map((item) => <div key={item.variantId} className="flex justify-between gap-4 text-[13px]"><div><p className="font-semibold text-[var(--text-primary)]">{item.brand} {item.model}</p><p className="text-[var(--text-secondary)]">{item.capacity} · {item.color} · x{item.quantity}</p></div><span className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span></div>)}</div><div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-[13px]"><div className="flex justify-between text-[var(--text-secondary)]"><span>Base 0%</span><span>{formatCurrency(totals.subtotalBase0)}</span></div><div className="flex justify-between text-[var(--text-secondary)]"><span>Base IVA {ivaRate}%</span><span>{formatCurrency(totals.subtotalBase15)}</span></div><div className="flex justify-between text-[var(--text-secondary)]"><span>IVA {ivaRate}%</span><span>{formatCurrency(totals.ivaAmount)}</span></div><div className="flex justify-between border-t border-[var(--border)] pt-4 text-[20px] font-bold"><span>Total</span><span>{formatCurrency(totals.total)}</span></div></div><p className="mt-5 text-[11px] leading-4 text-[var(--text-tertiary)]">Ambiente Sandbox. No se realizará un cargo real.</p></aside>
  </div></main>;
}
