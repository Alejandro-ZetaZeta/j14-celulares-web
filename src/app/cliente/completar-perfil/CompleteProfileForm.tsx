"use client";

import { useState } from "react";
import { updateClientProfileAction } from "@/lib/actions/auth";

export default function CompleteProfileForm({ initial }: { initial: { cedula: string; dateOfBirth: string; address: string } }) {
  const [cedula, setCedula] = useState(initial.cedula);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [address, setAddress] = useState(initial.address);
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
    <form onSubmit={submit} aria-busy={saving} className="flex flex-col gap-5">
      <p className="text-[14px] leading-6 text-[var(--text-secondary)]">Necesitamos estos datos para facturación y para mantener tu cuenta protegida.</p>
      {saving && <div role="status" className="overflow-hidden rounded-full bg-[var(--accent-light)]"><div className="h-1.5 w-2/5 animate-pulse rounded-full bg-[var(--accent)]" /></div>}
      {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Cédula / identificación <span className="font-normal text-[var(--text-tertiary)]">Solo dígitos, máximo 10</span><input required id="cedula" name="cedula" inputMode="numeric" pattern="[0-9]+" maxLength={10} value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Fecha de nacimiento<input required id="date_of_birth" name="date_of_birth" type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Dirección <span className="font-normal text-[var(--text-tertiary)]">Opcional</span><textarea name="address" rows={3} maxLength={250} value={address} onChange={(e) => setAddress(e.target.value)} className="resize-none rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
       <button type="submit" disabled={saving || !/^\d{1,10}$/.test(cedula) || !dateOfBirth} className="btn-primary w-full justify-center disabled:opacity-50">{saving ? "Guardando..." : "Completar perfil"}</button>
    </form>
  );
}
