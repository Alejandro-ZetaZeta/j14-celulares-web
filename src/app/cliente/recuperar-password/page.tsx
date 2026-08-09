"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ClientAuthShell from "@/components/client/ClientAuthShell";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export default function RecoverPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await requestPasswordResetAction(email);
    setLoading(false);
    if (result.error || !result.email) {
      setError(result.error?.message ?? "No pudimos iniciar la recuperación.");
      return;
    }
    router.push(`/cliente/restablecer-password?email=${encodeURIComponent(result.email)}`);
  }

  return (
    <ClientAuthShell eyebrow="Recuperar acceso" title="Restablece tu contraseña">
      <div className="flex flex-col gap-5">
        <p className="text-[14px] leading-6 text-[var(--text-secondary)]">Ingresa el correo de tu cuenta y te enviaremos un código de 6 dígitos.</p>
        {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Correo electrónico<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-[11px] border border-[var(--border-strong)] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">{loading ? "Buscando cuenta..." : "Enviar código"}</button>
        </form>
        <p className="text-center text-[14px] text-[var(--text-secondary)]"><Link href="/cliente/login" className="font-semibold text-[var(--accent)] hover:underline">Volver a iniciar sesión</Link></p>
      </div>
    </ClientAuthShell>
  );
}
