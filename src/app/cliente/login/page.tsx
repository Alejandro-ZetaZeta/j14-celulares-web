"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ClientAuthShell from "@/components/client/ClientAuthShell";
import PasswordVisibilityButton from "@/components/client/PasswordVisibilityButton";
import { initiateClientGoogleAction, signInClientAction } from "@/lib/actions/auth";

function ClientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    const result = await signInClientAction(formData);
    setLoading(false);
    if (result.error || !result.user) {
      setError(result.error?.message ?? "No pudimos iniciar sesión.");
      return;
    }
     router.replace(result.role === "client" ? "/cliente/dashboard" : "/admin/servicio-tecnico");
    router.refresh();
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
    <ClientAuthShell eyebrow="Bienvenido" title="Inicia sesión">
      <div className="flex flex-col gap-5">
        {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
        {resetSuccess && <p role="status" className="rounded-[12px] bg-[var(--accent-light)] px-4 py-3 text-[14px] text-[var(--accent)]">Contraseña actualizada. Ya puedes iniciar sesión.</p>}
        <button type="button" onClick={continueWithGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[12px] border border-[var(--border-strong)] px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50">
          <span className="text-[18px] font-bold" aria-hidden="true">G</span> Continuar con Google
        </button>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"><span className="h-px flex-1 bg-[var(--border)]" />o<span className="h-px flex-1 bg-[var(--border)]" /></div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
           <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Contraseña<span className="relative"><input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-[11px] border border-[var(--border-strong)] px-4 py-3 pr-12 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /><PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /></span></label>
          <button type="submit" disabled={loading} className="btn-primary mt-1 w-full justify-center disabled:opacity-50">{loading ? "Entrando..." : "Iniciar sesión"}</button>
        </form>
        <p className="text-center text-[14px] text-[var(--text-secondary)]"><Link href="/cliente/recuperar-password" className="font-semibold text-[var(--accent)] hover:underline">¿Olvidaste tu contraseña?</Link></p>
        <p className="text-center text-[14px] text-[var(--text-secondary)]">¿Aún no tienes cuenta? <Link href="/cliente/registro" className="font-semibold text-[var(--accent)] hover:underline">Regístrate</Link></p>
      </div>
    </ClientAuthShell>
  );
}

export default function ClientLoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando inicio de sesión...</div>}><ClientLoginContent /></Suspense>;
}
