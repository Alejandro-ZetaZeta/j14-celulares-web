"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ClientAuthShell from "@/components/client/ClientAuthShell";
import PasswordVisibilityButton from "@/components/client/PasswordVisibilityButton";
import { exchangePasswordResetTokenAction, resetPasswordAction } from "@/lib/actions/auth";
import { isStrongPassword, PASSWORD_REQUIREMENTS } from "@/lib/auth/password";

function ResetPasswordContent() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = digits.join("");

  function updateDigit(index: number, value: string) {
    const valueDigits = value.replace(/\D/g, "");
    if (!valueDigits) {
      setDigits((current) => current.map((digit, itemIndex) => itemIndex === index ? "" : digit));
      return;
    }
    setDigits((current) => {
      const next = [...current];
      valueDigits.slice(0, 6 - index).split("").forEach((digit, offset) => { next[index + offset] = digit; });
      return next;
    });
    inputRefs.current[Math.min(index + valueDigits.length, 5)]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      setDigits((current) => current.map((digit, itemIndex) => itemIndex === index - 1 ? "" : digit));
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    updateDigit(0, event.clipboardData.getData("text"));
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || otp.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos.");
      return;
    }
    setLoading(true);
    setError("");
    const tokenResult = await exchangePasswordResetTokenAction(email, otp);
    if (tokenResult.error || !tokenResult.token) {
      setLoading(false);
      setError(tokenResult.error?.message ?? "El código es incorrecto o ya expiró.");
      return;
    }
    setResetToken(tokenResult.token);
    setLoading(false);
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetToken || password !== confirmation || !isStrongPassword(password)) {
      setError(password !== confirmation ? "Las contraseñas no coinciden." : "Completa todos los requisitos de contraseña.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPasswordAction(password, resetToken);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.replace("/cliente/login?reset=success");
  }

  return (
      <ClientAuthShell eyebrow="Recuperar acceso" title={resetToken ? "Crea una nueva contraseña" : "Verifica tu código"}>
      <div className="flex flex-col gap-5">
        <p className="text-[14px] leading-6 text-[var(--text-secondary)]">{resetToken ? "Código confirmado. Ahora elige una nueva contraseña." : <>Enviamos un código a <strong className="text-[var(--text-primary)]">{email}</strong>.</>}</p>
        {!email && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">Falta el correo de recuperación. Solicita un código nuevo.</p>}
        {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
        {!resetToken ? <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <fieldset className="flex min-w-0 w-full flex-col gap-2">
            <legend className="text-[13px] font-semibold">Código OTP</legend>
            <div className="grid w-full min-w-0 grid-cols-6 gap-1.5 sm:gap-2" onPaste={handlePaste}>
              {digits.map((digit, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} required aria-label={`Dígito ${index + 1} de 6`} inputMode="numeric" pattern="[0-9]" maxLength={1} value={digit} autoFocus={index === 0} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)} className="box-border h-12 w-full min-w-0 rounded-[11px] border border-[var(--border-strong)] px-0 text-center text-[24px] font-bold outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:h-14 sm:text-[28px]" />)}
            </div>
          </fieldset>
          <button type="submit" disabled={loading || otp.length !== 6 || !email} className="btn-primary w-full justify-center disabled:opacity-50">{loading ? "Verificando código..." : "Verificar código"}</button>
        </form> : <form onSubmit={submitPassword} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Nueva contraseña<span className="relative"><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-[11px] border border-[var(--border-strong)] px-4 py-3 pr-12 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /><PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /></span></label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Repite la contraseña<span className="relative"><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-[11px] border border-[var(--border-strong)] px-4 py-3 pr-12 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /><PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /></span></label>
          <ul aria-label="Requisitos de contraseña" className="grid grid-cols-1 gap-1.5 rounded-[12px] bg-[var(--bg-secondary)] p-3 text-[12px] text-[var(--text-secondary)] sm:grid-cols-2">
            {PASSWORD_REQUIREMENTS.map((requirement) => <li key={requirement.key} className={requirement.test(password) ? "font-semibold text-[var(--status-green)]" : ""}><span aria-hidden="true">{requirement.test(password) ? "✓" : "○"}</span> {requirement.label}</li>)}
          </ul>
          <button type="submit" disabled={loading || !isStrongPassword(password) || password !== confirmation} className="btn-primary w-full justify-center disabled:opacity-50">{loading ? "Guardando..." : "Cambiar contraseña"}</button>
        </form>}
        <p className="text-center text-[14px] text-[var(--text-secondary)]"><Link href="/cliente/recuperar-password" className="font-semibold text-[var(--accent)] hover:underline">Solicitar otro código</Link></p>
      </div>
    </ClientAuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando recuperación...</div>}><ResetPasswordContent /></Suspense>;
}
