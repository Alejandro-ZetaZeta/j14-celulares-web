"use client";

import { useState } from "react";
import { useRef } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientAuthShell from "@/components/client/ClientAuthShell";
import { resendClientVerificationAction, verifyClientEmailAction } from "@/lib/actions/auth";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = digits.join("");

  function updateDigit(index: number, value: string) {
    const pastedDigits = value.replace(/\D/g, "");
    if (!pastedDigits) {
      setDigits((current) => current.map((digit, itemIndex) => itemIndex === index ? "" : digit));
      return;
    }

    setDigits((current) => {
      const next = [...current];
      pastedDigits.slice(0, 6 - index).split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });
    inputRefs.current[Math.min(index + pastedDigits.length, 5)]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      setDigits((current) => current.map((digit, itemIndex) => itemIndex === index - 1 ? "" : digit));
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    updateDigit(0, event.clipboardData.getData("text"));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      setError("Falta el correo que necesita verificación. Regresa al registro e inténtalo de nuevo.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await verifyClientEmailAction(email, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
     router.replace("/cliente/aceptar-terminos");
    router.refresh();
  }

  async function resend() {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setNotice("");
    const result = await resendClientVerificationAction(email);
    setResending(false);
    if (result.error) setError(result.error.message);
    else setNotice("Código reenviado. Revisa tu correo.");
  }

  return <ClientAuthShell eyebrow="Verificación" title="Confirma tu correo">
    <div className="flex flex-col gap-5">
       <p className="text-[14px] leading-6 text-[var(--text-secondary)]">{email ? <>Enviamos un código de 6 dígitos a <strong className="text-[var(--text-primary)]">{email}</strong>.</> : "Falta el correo que necesita verificación. Regresa al registro e inténtalo de nuevo."}</p>
      {error && <p role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-[12px] bg-[var(--accent-light)] px-4 py-3 text-[14px] text-[var(--accent)]">{notice}</p>}
      <form onSubmit={submit} className="flex flex-col gap-4">
          <fieldset className="flex min-w-0 w-full flex-col gap-2">
            <legend className="text-[13px] font-semibold">Código OTP</legend>
            <div className="grid w-full min-w-0 grid-cols-6 gap-1.5 sm:gap-2" onPaste={handlePaste}>
             {digits.map((digit, index) => (
               <input
                 key={index}
                 ref={(element) => { inputRefs.current[index] = element; }}
                 required
                 aria-label={`Dígito ${index + 1} de 6`}
                 inputMode="numeric"
                 pattern="[0-9]"
                 maxLength={1}
                 value={digit}
                 autoFocus={index === 0}
                 onChange={(event) => updateDigit(index, event.target.value)}
                 onKeyDown={(event) => handleKeyDown(index, event)}
                  className="box-border h-12 w-full min-w-0 rounded-[11px] border border-[var(--border-strong)] px-0 text-center text-[24px] font-bold outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:h-14 sm:text-[28px]"
               />
             ))}
           </div>
         </fieldset>
         <button type="submit" disabled={loading || otp.length !== 6 || !email} className="btn-primary w-full justify-center disabled:opacity-50">{loading ? "Verificando..." : "Verificar correo"}</button>
      </form>
       <button type="button" onClick={resend} disabled={resending || !email} className="text-[13px] font-semibold text-[var(--accent)] hover:underline disabled:opacity-50">{resending ? "Enviando código..." : "Reenviar código"}</button>
    </div>
  </ClientAuthShell>;
}

export default function VerifyOtpPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando verificación...</div>}><VerifyOtpContent /></Suspense>;
}
