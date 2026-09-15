"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/cart";
import { useCart } from "@/components/cart/CartProvider";
import { insforgeBrowser } from "@/lib/insforge-browser";
import { addBillingAddressAction } from "@/lib/actions/billing";
import { citiesForProvince, ECUADOR_PROVINCES } from "@/lib/ecuador";
import type { BillingAddress, UserProfile } from "@/types/database";

interface CustomerForm {
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  postcode: string;
}

const emptyNewAddress = { label: "", street: "", province: "", city: "", postcode: "" };

export default function CheckoutClient({ profile, initialEmail = "" }: { profile: UserProfile; initialEmail?: string }) {
  const router = useRouter();
  const { items, totals, ivaRate, promotionCode } = useCart();
  const [customer, setCustomer] = useState<CustomerForm>({
    fullName: profile.full_name ?? "",
    cedula: profile.cedula ?? "",
    email: initialEmail,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    province: profile.province ?? "",
    city: profile.city ?? "",
    postcode: profile.postcode ?? "",
  });
  const [savedAddresses, setSavedAddresses] = useState<BillingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("profile");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyNewAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void insforgeBrowser.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user || !active) return;
      setCustomer((current) => (current.email ? current : { ...current, email: data.user?.email ?? "" }));
      const { data: addresses } = await insforgeBrowser.database
        .from("billing_addresses")
        .select("id, user_id, label, street, province, city, postcode, created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true });
      if (active && addresses) setSavedAddresses(addresses);
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
    document.head.append(widget, validation);
    return () => { widget.remove(); validation.remove(); };
  }, [checkoutId]);

  function update(field: keyof CustomerForm, value: string) { setCustomer((current) => ({ ...current, [field]: value })); }

  function applyAddress(address: { street: string; province: string; city: string; postcode: string | null }, id: string) {
    setCustomer((current) => ({ ...current, address: address.street, province: address.province, city: address.city, postcode: address.postcode ?? "" }));
    setSelectedAddressId(id);
  }

  async function saveNewAddress() {
    if (savingAddress) return;
    setSavingAddress(true);
    setError("");
    const formData = new FormData();
    formData.set("label", newAddress.label);
    formData.set("street", newAddress.street);
    formData.set("province", newAddress.province);
    formData.set("city", newAddress.city);
    formData.set("postcode", newAddress.postcode);
    try {
      const result = await addBillingAddressAction(formData);
      if (result.error || !result.address) {
        setError(result.error?.message ?? "No se pudo guardar la dirección.");
        setSavingAddress(false);
        return;
      }
      setSavedAddresses((current) => [...current, result.address as BillingAddress]);
      applyAddress(result.address, result.address.id);
      setShowAddAddress(false);
      setNewAddress(emptyNewAddress);
      setSavingAddress(false);
    } catch {
      setSavingAddress(false);
      setError("No se pudo guardar la dirección. Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  async function proceed() {
    if (!items.length) { router.push("/catalogo"); return; }
    if (!customer.fullName.trim() || !/^\d{10}$/.test(customer.cedula.trim()) || !/^\S+@\S+\.\S+$/.test(customer.email.trim()) || !customer.phone.trim() || !customer.address.trim() || !customer.province.trim() || !customer.city.trim() || !/^\d{6}$/.test(customer.postcode.trim())) { setError("Completa todos los datos. La cédula debe contener exactamente 10 dígitos y el código postal 6 dígitos."); return; }
    setError(""); setStatus("Preparando pago seguro Dataweb..."); setPaying(true);
    try {
      const payloadItems = items.map((item) => ({ variantId: item.variantId, brand: item.brand, model: item.model, capacity: item.capacity, color: item.color, unitPrice: item.unitPrice, quantity: item.quantity, giftVariantIds: item.gifts.map((gift) => gift.variantId) }));
      const response = await fetch("/api/payments/dataweb-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { ...customer, birthDate: profile.date_of_birth ?? undefined }, items: payloadItems, totals, promotionCode }) });
      const result = await response.json() as { checkoutId?: string; error?: string };
      if (!response.ok || !result.checkoutId) throw new Error(result.error ?? "No se pudo iniciar Dataweb.");
      setCheckoutId(result.checkoutId); setStatus("Completa datos de tarjeta en formulario Dataweb.");
    } catch (caught) { setPaying(false); setError(caught instanceof Error ? caught.message : "No se pudo abrir Dataweb."); }
  }

  if (!items.length) return <main className="container-wide flex min-h-[65vh] items-center justify-center px-5 py-16"><div className="text-center"><p className="catalog-kicker">Checkout</p><h1 className="mt-2 text-display">Tu carrito esta vacio</h1><Link href="/catalogo" className="btn-primary mt-6 inline-flex">Volver al catalogo</Link></div></main>;

  const cityOptions = newAddress.province ? citiesForProvince(newAddress.province) : [];

  return (
    <main className="container-wide px-5 pb-24 pt-8">
      <div className="mb-10 max-w-2xl">
        <p className="catalog-kicker">Checkout seguro · Dataweb Sandbox</p>
        <h1 className="mt-2 text-display">Completa tu compra</h1>
        <p className="mt-3 text-[15px] text-[var(--text-secondary)]">Tu tarjeta se procesa en formulario seguro certificado de Datafast.</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <aside className="order-first h-fit rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 sm:p-6 lg:order-2">
          <h2 className="text-[18px] font-bold">Resumen de compra</h2>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between gap-4 text-[13px]">
                <div>
                  <p className="font-semibold">{item.brand} {item.model}</p>
                  <p className="text-[var(--text-secondary)]">{item.capacity} · {item.color} · x{item.quantity}</p>
                  {item.gifts.length > 0 && item.gifts.map((gift) => (
                    <p key={gift.variantId} className="mt-0.5 text-[12px] text-[var(--accent)]">🎁 Incluye regalo: {gift.brand} {gift.model} ({gift.capacity} · {gift.color}) x {gift.quantity * item.quantity}</p>
                  ))}
                </div>
                <span className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-[13px]">
            <div className="flex justify-between text-[var(--text-secondary)]"><span>Base IVA {ivaRate}%</span><span>{formatCurrency(totals.subtotalBase15)}</span></div>
            <div className="flex justify-between text-[var(--text-secondary)]"><span>IVA {ivaRate}%</span><span>{formatCurrency(totals.ivaAmount)}</span></div>
            <div className="flex justify-between border-t border-[var(--border)] pt-4 text-[20px] font-bold"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          </div>
          <p className="mt-5 text-[11px] leading-4 text-[var(--text-tertiary)]">Ambiente Sandbox. No se realizara cargo real.</p>
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            {error && <p className="mb-3 rounded-[var(--radius-sm)] bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
            {status && !checkoutId && <p className="mb-3 text-[13px] text-[var(--text-secondary)]">{status}</p>}
            {!checkoutId && <button type="button" onClick={() => void proceed()} disabled={paying} className="btn-primary w-full justify-center disabled:opacity-50">{paying ? "Preparando..." : "Continuar con Dataweb"}</button>}
          </div>
        </aside>
        <section className="order-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 lg:order-1">
          <h2 className="text-[20px] font-bold">Datos del cliente</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Nombre completo *<input type="text" value={customer.fullName} onChange={(event) => update("fullName", event.target.value)} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Cedula *<input type="text" inputMode="numeric" maxLength={10} value={customer.cedula} onChange={(event) => update("cedula", event.target.value.replace(/\D/g, "").slice(0, 10))} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Correo electronico *<input type="email" value={customer.email} onChange={(event) => update("email", event.target.value)} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Telefono *<input type="tel" value={customer.phone} onChange={(event) => update("phone", event.target.value)} className="input-apple mt-2 w-full" required /></label>
          </div>

          <h2 className="mt-8 text-[20px] font-bold">Dirección de facturación y envío</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Para cambiar la dirección usa una dirección guardada o crea una nueva; no se modifica tu perfil desde aquí.</p>
          <div className="mt-4 space-y-3">
            <label className={`flex cursor-pointer gap-3 rounded-[var(--radius-sm)] border p-4 text-[13px] ${selectedAddressId === "profile" ? "border-[var(--accent)] bg-[var(--accent-light)]/40" : "border-[var(--border)]"}`}>
              <input type="radio" name="billing-address" checked={selectedAddressId === "profile"} onChange={() => applyAddress({ street: profile.address ?? "", province: profile.province ?? "", city: profile.city ?? "", postcode: profile.postcode ?? "" }, "profile")} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Dirección principal (perfil)</span>
                <span className="mt-1 block text-[var(--text-secondary)]">{profile.address || "—"} · {profile.city || "—"} · {profile.province || "—"} · {profile.postcode || "—"}</span>
              </span>
            </label>
            {savedAddresses.map((saved) => (
              <label key={saved.id} className={`flex cursor-pointer gap-3 rounded-[var(--radius-sm)] border p-4 text-[13px] ${selectedAddressId === saved.id ? "border-[var(--accent)] bg-[var(--accent-light)]/40" : "border-[var(--border)]"}`}>
                <input type="radio" name="billing-address" checked={selectedAddressId === saved.id} onChange={() => applyAddress(saved, saved.id)} className="mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold">{saved.label || "Dirección guardada"}</span>
                  <span className="mt-1 block text-[var(--text-secondary)]">{saved.street} · {saved.city} · {saved.province} · {saved.postcode}</span>
                </span>
              </label>
            ))}
          </div>

          <button type="button" onClick={() => setShowAddAddress((current) => !current)} className="mt-4 text-[13px] font-semibold text-[var(--accent)] underline underline-offset-4 hover:opacity-80">
            {showAddAddress ? "Cancelar" : "+ Agregar nueva dirección de facturación"}
          </button>

          {showAddAddress && (
            <div className="mt-4 space-y-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
              <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Nueva dirección</p>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Etiqueta (opcional)<input type="text" maxLength={60} value={newAddress.label} onChange={(event) => setNewAddress((current) => ({ ...current, label: event.target.value }))} placeholder="Ej: Casa, Oficina" className="input-apple mt-2 w-full" /></label>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Calle y número *<input type="text" maxLength={250} value={newAddress.street} onChange={(event) => setNewAddress((current) => ({ ...current, street: event.target.value }))} className="input-apple mt-2 w-full" required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Provincia *<select value={newAddress.province} onChange={(event) => setNewAddress((current) => ({ ...current, province: event.target.value, city: "" }))} className="input-apple mt-2 w-full" required><option value="">Selecciona...</option>{ECUADOR_PROVINCES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Ciudad *<select value={newAddress.city} onChange={(event) => setNewAddress((current) => ({ ...current, city: event.target.value }))} disabled={!newAddress.province} className="input-apple mt-2 w-full disabled:opacity-50" required><option value="">{newAddress.province ? "Selecciona..." : "Elige provincia primero"}</option>{cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              </div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Código postal *<input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={newAddress.postcode} onChange={(event) => setNewAddress((current) => ({ ...current, postcode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className="input-apple mt-2 w-full" required /></label>
              <button type="button" onClick={() => void saveNewAddress()} disabled={savingAddress || !newAddress.street.trim() || !newAddress.province || !newAddress.city || !/^\d{6}$/.test(newAddress.postcode)} className="btn-primary w-full justify-center disabled:opacity-50">{savingAddress ? "Guardando..." : "Guardar y usar esta dirección"}</button>
            </div>
          )}
        </section>
      </div>
      {checkoutId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="catalog-kicker">Pago seguro</p>
              <button type="button" onClick={() => { setCheckoutId(null); setStatus(""); setPaying(false); }} className="text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancelar</button>
            </div>
            <h2 className="mt-2 text-[20px] font-bold">Completa los datos de tu tarjeta</h2>
            {status && <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{status}</p>}
            <form action="/api/payments/dataweb-result" className="paymentWidgets mt-5 w-full" data-brands="VISA MASTER DINERS DISCOVER AMEX" />
          </div>
        </div>
      )}
    </main>
  );
}