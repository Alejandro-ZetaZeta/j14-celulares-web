"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/cart";
import { useCart } from "@/components/cart/CartProvider";
import { insforgeBrowser } from "@/lib/insforge-browser";
import { addBillingAddressAction } from "@/lib/actions/billing";
import { citiesForProvince, ECUADOR_PROVINCES } from "@/lib/ecuador";
import { SecurityBadge } from "@/components/checkout/PaymentBadges";
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
  const [saveCard, setSaveCard] = useState(false);

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

    const injectFields = () => {
      const form = document.querySelector<HTMLFormElement>("form.wpwl-form-card") ||
                   document.querySelector<HTMLFormElement>("form.wpwl-form") ||
                   document.querySelector<HTMLFormElement>("form.paymentWidgets");
      if (!form || form.querySelector(".datafast-custom-fields")) return;

      const customDiv = document.createElement("div");
      customDiv.className = "datafast-custom-fields space-y-3 mb-4";
      customDiv.innerHTML = `
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
          <div class="wpwl-group wpwl-group-custom" style="flex: 1; min-width: 130px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: inherit;">Diferidos (Meses):</label>
            <div class="wpwl-wrapper wpwl-wrapper-custom">
              <select name="customParameters[SHOPPER_DIFERESSION]" class="wpwl-control wpwl-control-custom" style="width: 100%; border-radius: 6px; border: 1px solid #d1d5db; padding: 6px 10px; font-size: 13px; background-color: #fff; color: #111;">
                <option value="0">00 - Corriente (Sin diferido)</option>
                <option value="3">03 Meses</option>
                <option value="6">06 Meses</option>
                <option value="9">09 Meses</option>
                <option value="12">12 Meses</option>
              </select>
            </div>
          </div>
          <div class="wpwl-group wpwl-group-custom" style="flex: 1; min-width: 180px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: inherit;">Tipo de Crédito:</label>
            <div class="wpwl-wrapper wpwl-wrapper-custom">
              <select name="customParameters[SHOPPER_TIPOCREDITO]" class="wpwl-control wpwl-control-custom" style="width: 100%; border-radius: 6px; border: 1px solid #d1d5db; padding: 6px 10px; font-size: 13px; background-color: #fff; color: #111;">
                <option value="00">00 - Corriente</option>
                <option value="01">01 - Diferido corriente sin intereses</option>
                <option value="02">02 - Diferido con intereses</option>
                <option value="03">03 - Diferido con meses de gracia</option>
                <option value="21">21 - Diferido Plus cuotas</option>
                <option value="22">22 - Diferido Plus</option>
              </select>
            </div>
          </div>
        </div>
        <div class="datafast-official-verified" style="margin-top: 10px; text-align: center; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <img src="/images/datafast-verified.png" alt="Datafast Verified - Tarjetas Aceptadas" style="display: block; margin: 0 auto; max-width: 290px; width: 100%; height: auto;" onerror="this.src='https://www.datafast.com.ec/images/verified.png'" />
        </div>
      `;

      const submitBtn = form.querySelector(".wpwl-button-pay") || form.querySelector(".wpwl-button") || form.querySelector("button[type=submit]");
      if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(customDiv, submitBtn);
      } else {
        form.appendChild(customDiv);
      }
    };

    (window as unknown as { wpwlOptions?: Record<string, unknown> }).wpwlOptions = {
      style: "card", locale: "es", maskCvv: true, brandDetection: true,
      labels: { cvv: "CVV", cardHolder: "Nombre (igual que en la tarjeta)" },
      onReady: injectFields,
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
    document.head.append(widget);

    const interval = setInterval(injectFields, 250);
    const timeout = setTimeout(() => clearInterval(interval), 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      widget.remove();
    };
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
      const response = await fetch("/api/payments/dataweb-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { ...customer, birthDate: profile.date_of_birth ?? undefined }, items: payloadItems, totals, promotionCode, saveCard }) });
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
        <p className="mt-3 text-[15px] text-text-secondary">Tu tarjeta se procesa en formulario seguro certificado de Datafast.</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <aside className="order-first h-fit rounded-lg border border-border bg-(--bg-secondary) p-5 sm:p-6 lg:order-2">
          <h2 className="text-[18px] font-bold">Resumen de compra</h2>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between gap-4 text-[13px]">
                <div>
                  <p className="font-semibold">{item.brand} {item.model}</p>
                  <p className="text-text-secondary">{item.capacity} · {item.color} · x{item.quantity}</p>
                  {item.gifts.length > 0 && item.gifts.map((gift) => (
                    <p key={gift.variantId} className="mt-0.5 text-[12px] text-accent">🎁 Incluye regalo: {gift.brand} {gift.model} ({gift.capacity} · {gift.color}) x {gift.quantity * item.quantity}</p>
                  ))}
                </div>
                <span className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-border pt-5 text-[13px]">
            <div className="flex justify-between text-text-secondary"><span>Base IVA {ivaRate}%</span><span>{formatCurrency(totals.subtotalBase15)}</span></div>
            <div className="flex justify-between text-text-secondary"><span>IVA {ivaRate}%</span><span>{formatCurrency(totals.ivaAmount)}</span></div>
            <div className="flex justify-between border-t border-border pt-4 text-[20px] font-bold"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          </div>
          <p className="mt-5 text-[11px] leading-4 text-text-tertiary">Ambiente Sandbox. No se realizara cargo real.</p>
          <div className="mt-5 border-t border-border pt-5">
            {!checkoutId && (
              <label className="mb-4 flex cursor-pointer items-start gap-2 text-[12px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(event) => setSaveCard(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                />
                <span>Guardar tarjeta de forma segura para compras futuras (One-Click)</span>
              </label>
            )}
            {error && <p className="mb-3 rounded-sm bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
            {status && !checkoutId && <p className="mb-3 text-[13px] text-text-secondary">{status}</p>}
            {!checkoutId && <button type="button" onClick={() => void proceed()} disabled={paying} className="btn-primary w-full justify-center disabled:opacity-50">{paying ? "Preparando..." : "Continuar con Dataweb"}</button>}
          </div>
          <div className="mt-6">
            <SecurityBadge />
          </div>
        </aside>
        <section className="order-2 rounded-lg border border-border bg-surface p-5 sm:p-8 lg:order-1">
          <h2 className="text-[20px] font-bold">Datos del cliente</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-[13px] font-semibold text-text-secondary">Nombre completo *<input type="text" value={customer.fullName} onChange={(event) => update("fullName", event.target.value)} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-text-secondary">Cedula *<input type="text" inputMode="numeric" maxLength={10} value={customer.cedula} onChange={(event) => update("cedula", event.target.value.replace(/\D/g, "").slice(0, 10))} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-text-secondary">Correo electronico *<input type="email" value={customer.email} onChange={(event) => update("email", event.target.value)} className="input-apple mt-2 w-full" required /></label>
            <label className="text-[13px] font-semibold text-text-secondary">Telefono *<input type="tel" value={customer.phone} onChange={(event) => update("phone", event.target.value)} className="input-apple mt-2 w-full" required /></label>
          </div>

          <h2 className="mt-8 text-[20px] font-bold">Dirección de facturación y envío</h2>
          <p className="mt-1 text-[13px] text-text-secondary">Para cambiar la dirección usa una dirección guardada o crea una nueva; no se modifica tu perfil desde aquí.</p>
          <div className="mt-4 space-y-3">
            <label className={`flex cursor-pointer gap-3 rounded-sm border p-4 text-[13px] ${selectedAddressId === "profile" ? "border-accent bg-(--accent-light)/40" : "border-border"}`}>
              <input type="radio" name="billing-address" checked={selectedAddressId === "profile"} onChange={() => applyAddress({ street: profile.address ?? "", province: profile.province ?? "", city: profile.city ?? "", postcode: profile.postcode ?? "" }, "profile")} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Dirección principal (perfil)</span>
                <span className="mt-1 block text-text-secondary">{profile.address || "—"} · {profile.city || "—"} · {profile.province || "—"} · {profile.postcode || "—"}</span>
              </span>
            </label>
            {savedAddresses.map((saved) => (
              <label key={saved.id} className={`flex cursor-pointer gap-3 rounded-sm border p-4 text-[13px] ${selectedAddressId === saved.id ? "border-accent bg-(--accent-light)/40" : "border-border"}`}>
                <input type="radio" name="billing-address" checked={selectedAddressId === saved.id} onChange={() => applyAddress(saved, saved.id)} className="mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold">{saved.label || "Dirección guardada"}</span>
                  <span className="mt-1 block text-text-secondary">{saved.street} · {saved.city} · {saved.province} · {saved.postcode}</span>
                </span>
              </label>
            ))}
          </div>

          <button type="button" onClick={() => setShowAddAddress((current) => !current)} className="mt-4 text-[13px] font-semibold text-accent underline underline-offset-4 hover:opacity-80">
            {showAddAddress ? "Cancelar" : "+ Agregar nueva dirección de facturación"}
          </button>

          {showAddAddress && (
            <div className="mt-4 space-y-4 rounded-sm border border-border bg-(--bg-secondary) p-5">
              <p className="text-[13px] font-semibold text-text-secondary">Nueva dirección</p>
              <label className="block text-[13px] font-semibold text-text-secondary">Etiqueta (opcional)<input type="text" maxLength={60} value={newAddress.label} onChange={(event) => setNewAddress((current) => ({ ...current, label: event.target.value }))} placeholder="Ej: Casa, Oficina" className="input-apple mt-2 w-full" /></label>
              <label className="block text-[13px] font-semibold text-text-secondary">Calle y número *<input type="text" maxLength={250} value={newAddress.street} onChange={(event) => setNewAddress((current) => ({ ...current, street: event.target.value }))} className="input-apple mt-2 w-full" required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-semibold text-text-secondary">Provincia *<select value={newAddress.province} onChange={(event) => setNewAddress((current) => ({ ...current, province: event.target.value, city: "" }))} className="input-apple mt-2 w-full" required><option value="">Selecciona...</option>{ECUADOR_PROVINCES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                <label className="block text-[13px] font-semibold text-text-secondary">Ciudad *<select value={newAddress.city} onChange={(event) => setNewAddress((current) => ({ ...current, city: event.target.value }))} disabled={!newAddress.province} className="input-apple mt-2 w-full disabled:opacity-50" required><option value="">{newAddress.province ? "Selecciona..." : "Elige provincia primero"}</option>{cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              </div>
              <label className="block text-[13px] font-semibold text-text-secondary">Código postal *<input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={newAddress.postcode} onChange={(event) => setNewAddress((current) => ({ ...current, postcode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className="input-apple mt-2 w-full" required /></label>
              <button type="button" onClick={() => void saveNewAddress()} disabled={savingAddress || !newAddress.street.trim() || !newAddress.province || !newAddress.city || !/^\d{6}$/.test(newAddress.postcode)} className="btn-primary w-full justify-center disabled:opacity-50">{savingAddress ? "Guardando..." : "Guardar y usar esta dirección"}</button>
            </div>
          )}
        </section>
      </div>
      {checkoutId && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
          <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-status-green text-[18px] tracking-tight">Datafast</span>
                <span className="text-[13px] font-semibold text-text-secondary">· Pasarela de Pago Segura</span>
              </div>
              <button type="button" onClick={() => { setCheckoutId(null); setStatus(""); setPaying(false); }} className="rounded-md px-2.5 py-1 text-[13px] font-semibold text-text-secondary hover:bg-(--bg-secondary) hover:text-foreground">Cerrar</button>
            </div>

            <h2 className="mt-4 text-[18px] font-bold">Completa los datos de tu tarjeta</h2>
            {status && <p className="mt-1 text-[13px] text-text-secondary">{status}</p>}
            <div className="mt-4 flex justify-center">
              <form action="/api/payments/dataweb-result" className="paymentWidgets w-full" data-brands="VISA MASTER DINERS DISCOVER AMEX" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}