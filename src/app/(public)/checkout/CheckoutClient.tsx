"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/cart";
import { useCart } from "@/components/cart/CartProvider";
import { insforgeBrowser } from "@/lib/insforge-browser";
interface CustomerForm {
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
}

const emptyCustomer: CustomerForm = { fullName: "", cedula: "", email: "", phone: "", address: "" };

export default function CheckoutClient({ initialIsAuthenticated = false }: { initialIsAuthenticated?: boolean }) {
  const router = useRouter();
  const { items, totals, ivaRate, promotionCode } = useCart();
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState(false);
  const [isAuthenticated] = useState(initialIsAuthenticated);
  const [guestTermsAccepted, setGuestTermsAccepted] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void insforgeBrowser.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user || !active) return;
      const { data: profile } = await insforgeBrowser.database.from("user_profiles").select("full_name, cedula, phone, address").eq("id", data.user.id).maybeSingle();
      if (active && profile) setCustomer((current) => ({ ...current, fullName: profile.full_name ?? "", cedula: profile.cedula ?? "", phone: profile.phone ?? "", address: profile.address ?? "", email: data.user?.email ?? "" }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!checkoutId) return;
    (window as unknown as { wpwlOptions?: Record<string, unknown> }).wpwlOptions = {
      style: "card", locale: "es", maskCvv: true, brandDetection: true,
      labels: { cvv: "CVV", cardHolder: "Nombre (igual que en la tarjeta)" },
      onBeforeSubmitCard: () => {
        const holder = document.querySelector<HTMLInputElement>(".wpwl-control-cardHolder");
        if (!holder?.value.trim()) { holder?.focus(); return false; }
        return true;
      },
    };
    const widget = document.createElement("script");
    widget.id = "dataweb-payment-widget";
    widget.src = `${process.env.NEXT_PUBLIC_DATAWEB_WIDGET_URL || "https://eu-test.oppwa.com/v1/paymentWidgets.js"}?checkoutId=${encodeURIComponent(checkoutId)}`;
    widget.async = true;
    const validation = document.createElement("script");
    validation.id = "dataweb-validations";
    validation.src = "https://www.datafast.com.ec/js/dfAdditionalValidations1.js";
    validation.async = true;
    const form = document.createElement("form");
    form.action = `${window.location.origin}/api/payments/dataweb-result`;
    form.className = "paymentWidgets";
    form.dataset.brands = "VISA MASTER DINERS DISCOVER AMEX";
    document.body.append(form);
    document.head.append(widget, validation);
    return () => { form.remove(); widget.remove(); validation.remove(); };
  }, [checkoutId]);

  function update(field: keyof CustomerForm, value: string) { setCustomer((current) => ({ ...current, [field]: value })); }

  async function proceed() {
    if (!items.length) { router.push("/catalogo"); return; }
    if (!isAuthenticated && !guestTermsAccepted) { setError("Lee y acepta los Términos y Condiciones para continuar."); return; }
    if (!customer.fullName.trim() || !/^\d{10}$/.test(customer.cedula.trim()) || !/^\S+@\S+\.\S+$/.test(customer.email.trim()) || !customer.phone.trim() || !customer.address.trim()) { setError("Completa todos los datos. La cédula debe contener exactamente 10 dígitos."); return; }
    setError(""); setStatus("Preparando pago seguro Dataweb..."); setPaying(true);
    try {
      const response = await fetch("/api/payments/dataweb-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items, totals, promotionCode }) });
      const result = await response.json() as { checkoutId?: string; error?: string };
      if (!response.ok || !result.checkoutId) throw new Error(result.error ?? "No se pudo iniciar Dataweb.");
      setCheckoutId(result.checkoutId); setStatus("Completa datos de tarjeta en formulario Dataweb.");
    } catch (caught) { setPaying(false); setError(caught instanceof Error ? caught.message : "No se pudo abrir Dataweb."); }
  }

  if (!items.length) return <main className="container-wide flex min-h-[65vh] items-center justify-center px-5 py-28"><div className="text-center"><p className="catalog-kicker">Checkout</p><h1 className="mt-2 text-display">Tu carrito esta vacio</h1><Link href="/catalogo" className="btn-primary mt-6 inline-flex">Volver al catalogo</Link></div></main>;

  return <main className="container-wide px-5 pb-24 pt-28"><div className="mb-10 max-w-2xl"><p className="catalog-kicker">Checkout seguro · Dataweb Sandbox</p><h1 className="mt-2 text-display">Completa tu compra</h1><p className="mt-3 text-[15px] text-[var(--text-secondary)]">Tu tarjeta se procesa en formulario seguro certificado de Datafast.</p></div><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"><h2 className="text-[20px] font-bold">Datos del cliente</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-[13px] font-semibold text-[var(--text-secondary)]">Nombre completo *<input type="text" value={customer.fullName} onChange={(event) => update("fullName", event.target.value)} className="input-apple mt-2 w-full" required /></label><label className="text-[13px] font-semibold text-[var(--text-secondary)]">Cedula *<input type="text" inputMode="numeric" maxLength={10} value={customer.cedula} onChange={(event) => update("cedula", event.target.value.replace(/\D/g, "").slice(0, 10))} className="input-apple mt-2 w-full" required /></label><label className="text-[13px] font-semibold text-[var(--text-secondary)]">Correo electronico *<input type="email" value={customer.email} onChange={(event) => update("email", event.target.value)} className="input-apple mt-2 w-full" required /></label><label className="text-[13px] font-semibold text-[var(--text-secondary)]">Telefono *<input type="tel" value={customer.phone} onChange={(event) => update("phone", event.target.value)} className="input-apple mt-2 w-full" required /></label><label className="text-[13px] font-semibold text-[var(--text-secondary)] sm:col-span-2">Direccion de facturacion y envio *<input type="text" value={customer.address} onChange={(event) => update("address", event.target.value)} className="input-apple mt-2 w-full" required /></label></div>{!isAuthenticated && <label className="mt-6 flex gap-3 text-[13px] text-[var(--text-secondary)]"><input type="checkbox" checked={guestTermsAccepted} onChange={(event) => setGuestTermsAccepted(event.target.checked)} />Acepto Términos y Condiciones y política de devoluciones.</label>}{error && <p className="mt-5 rounded-[var(--radius-sm)] bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}{status && <p className="mt-5 text-[13px] text-[var(--text-secondary)]">{status}</p>}{!checkoutId ? <button type="button" onClick={() => void proceed()} disabled={paying} className="btn-primary mt-7 w-full disabled:opacity-50">{paying ? "Preparando..." : "Continuar con Dataweb"}</button> : <form action="/api/payments/dataweb-result" className="paymentWidgets mt-7" data-brands="VISA MASTER DINERS DISCOVER AMEX" />}</section><aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 sm:p-6"><h2 className="text-[18px] font-bold">Resumen de compra</h2><div className="mt-5 space-y-4">{items.map((item) => <div key={item.variantId} className="flex justify-between gap-4 text-[13px]"><div><p className="font-semibold">{item.brand} {item.model}</p><p className="text-[var(--text-secondary)]">{item.capacity} · {item.color} · x{item.quantity}</p></div><span className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span></div>)}</div><div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-[13px]"><div className="flex justify-between text-[var(--text-secondary)]"><span>Base IVA {ivaRate}%</span><span>{formatCurrency(totals.subtotalBase15)}</span></div><div className="flex justify-between text-[var(--text-secondary)]"><span>IVA {ivaRate}%</span><span>{formatCurrency(totals.ivaAmount)}</span></div><div className="flex justify-between border-t border-[var(--border)] pt-4 text-[20px] font-bold"><span>Total</span><span>{formatCurrency(totals.total)}</span></div></div><p className="mt-5 text-[11px] leading-4 text-[var(--text-tertiary)]">Ambiente Sandbox. No se realizara cargo real.</p></aside></div></main>;
}
