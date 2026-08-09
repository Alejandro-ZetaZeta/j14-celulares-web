"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ClientAuthShell from "@/components/client/ClientAuthShell";
import PasswordVisibilityButton from "@/components/client/PasswordVisibilityButton";
import { initiateClientGoogleAction, registerClientAction } from "@/lib/actions/auth";
import { isStrongPassword, PASSWORD_REQUIREMENTS } from "@/lib/auth/password";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isStrongPassword(password)) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("password", password);
    const result = await registerClientAction(formData);
    if (result.error || (!result.user && !result.requiresVerification)) {
      setLoading(false);
      setError(result.error?.message ?? "No pudimos crear tu cuenta.");
      return;
    }
    if (result.requiresVerification) {
      router.push(`/cliente/verificar-otp?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/cliente/aceptar-terminos");
      router.refresh();
    }
  }

  async function continueWithGoogle() {
    setLoading(true);
    const result = await initiateClientGoogleAction();
    if (result.url) window.location.assign(result.url);
    else {
      setLoading(false);
      setError(result.error?.message ?? "Google OAuth no está disponible.");
    }
  }

  return (
    <ClientAuthShell eyebrow="Crear cuenta" title="Tu reparación, contigo">
      <div className="flex flex-col gap-5">
        {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
        <button type="button" onClick={continueWithGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[12px] border border-[var(--border-strong)] px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"><span className="text-[18px] font-bold" aria-hidden="true">G</span> Continuar con Google</button>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"><span className="h-px flex-1 bg-[var(--border)]" />o<span className="h-px flex-1 bg-[var(--border)]" /></div>
        <form onSubmit={submit} className="flex flex-col gap-4">
           <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Nombre completo<input required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
           <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Correo electrónico<input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
           <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Teléfono<input required maxLength={10} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} autoComplete="tel" className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
           <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Contraseña<span className="relative"><input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-[11px] border border-[var(--border-strong)] px-4 py-3 pr-12 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /><PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /></span></label>
          <ul aria-label="Requisitos de contraseña" className="grid grid-cols-1 gap-1.5 rounded-[12px] bg-[var(--bg-secondary)] p-3 text-[12px] text-[var(--text-secondary)] sm:grid-cols-2">
            {PASSWORD_REQUIREMENTS.map((requirement) => {
              const valid = requirement.test(password);
              return <li key={requirement.key} className={valid ? "font-semibold text-[var(--status-green)]" : ""}><span aria-hidden="true">{valid ? "✓" : "○"}</span> {requirement.label}</li>;
            })}
           </ul>
           <button type="submit" disabled={loading || !isStrongPassword(password)} className="btn-primary mt-1 w-full justify-center disabled:opacity-50">{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
        </form>
        <p className="text-center text-[14px] text-[var(--text-secondary)]">¿Ya tienes cuenta? <Link href="/cliente/login" className="font-semibold text-[var(--accent)] hover:underline">Inicia sesión</Link></p>
      </div>
    </ClientAuthShell>
  );
}
