"use client";

import { useState } from "react";
import { updateClientProfileAction } from "@/lib/actions/auth";
import { citiesForProvince, ECUADOR_PROVINCES } from "@/lib/ecuador";

export default function CompleteProfileForm({ initial }: { initial: { fullName: string; phone: string; cedula: string; dateOfBirth: string; address: string; province: string; city: string; postcode: string } }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [cedula, setCedula] = useState(initial.cedula);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [address, setAddress] = useState(initial.address);
  const [province, setProvince] = useState(initial.province);
  const [city, setCity] = useState(initial.city);
  const [postcode, setPostcode] = useState(initial.postcode);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    let result: Awaited<ReturnType<typeof updateClientProfileAction>>;
    try {
      result = await updateClientProfileAction(formData);
    } catch {
      setSaving(false);
      setError("No pudimos completar tu perfil. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (result.error) {
      setSaving(false);
      setError(result.error.message);
      return;
    }
    window.location.assign("/cliente/dashboard");
  }

  return (
    <form onSubmit={submit} aria-busy={saving} className="flex flex-col gap-4">
      <p className="text-[14px] leading-6 text-[var(--text-secondary)]">Necesitamos estos datos para facturación y para mantener tu cuenta protegida.</p>
      {saving && <div role="status" className="overflow-hidden rounded-full bg-[var(--accent-light)]"><div className="h-1.5 w-2/5 animate-pulse rounded-full bg-[var(--accent)]" /></div>}
      {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
      <div className="grid gap-3.5 sm:grid-cols-2">
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Nombre completo<span className="font-normal text-[var(--text-tertiary)]">Como figura en tu cédula</span><input required id="full_name" name="full_name" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Teléfono <span className="font-normal text-[var(--text-tertiary)]">Solo dígitos, máximo 10</span><input required id="phone" name="phone" inputMode="numeric" pattern="[0-9]+" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Cédula <span className="font-normal text-[var(--text-tertiary)]">Solo dígitos, máximo 10</span><input required id="cedula" name="cedula" inputMode="numeric" pattern="[0-9]+" maxLength={10} value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Fecha de nacimiento <span className="font-normal text-[var(--text-tertiary)]">Mayor de 18 años</span><input required id="date_of_birth" name="date_of_birth" type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Dirección<textarea required name="address" rows={2} maxLength={250} value={address} onChange={(e) => setAddress(e.target.value)} className="resize-none rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
        <div className="grid gap-3.5 sm:grid-cols-2">
         <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Provincia <span className="font-normal text-[var(--text-tertiary)]">Selecciona primero la provincia</span><select required name="province" value={province} onChange={(e) => { setProvince(e.target.value); setCity(""); setPostcode(""); }} className="rounded-[11px] border border-[var(--border-strong)] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"><option value="">Selecciona...</option>{ECUADOR_PROVINCES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
         <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Ciudad <span className="font-normal text-[var(--text-tertiary)]">Solo ciudades de la provincia</span><select required name="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={!province} className="rounded-[11px] border border-[var(--border-strong)] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-50"><option value="">{province ? "Selecciona..." : "Elige provincia primero"}</option>{province && citiesForProvince(province).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Código postal<span className="font-normal text-[var(--text-tertiary)]">Seis dígitos, sin letras. Ejemplo: 010150</span><input required name="postcode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
        <button type="submit" disabled={saving || !fullName.trim() || !/^\d{1,10}$/.test(phone) || !/^\d{1,10}$/.test(cedula) || !dateOfBirth || !address.trim() || !province || !city || !/^\d{6}$/.test(postcode)} className="btn-primary w-full justify-center disabled:opacity-50">{saving ? "Guardando..." : "Completar perfil"}</button>
    </form>
  );
}
