"use client";

import { useState } from "react";

type TermsAcceptanceModalProps = {
  children: React.ReactNode;
  onAccept: () => void;
  title?: string;
  buttonLabel?: string;
  openOnMount?: boolean;
  triggerLabel?: string;
};

export default function TermsAcceptanceModal({
  children,
  onAccept,
  title = "Lee y acepta los términos",
  buttonLabel = "Acepto los Términos y Condiciones",
  openOnMount = false,
  triggerLabel = "Revisar Términos y Condiciones",
}: TermsAcceptanceModalProps) {
  const [isOpen, setIsOpen] = useState(openOnMount);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 15) setHasScrolledToBottom(true);
  }

  async function submitAcceptance() {
    if (submitting || !hasScrolledToBottom || !checked) return;
    setSubmitting(true);
    try {
      await onAccept();
    } catch {
      setSubmitting(false);
    }
  }

  return <>
    {!openOnMount && <button type="button" onClick={() => setIsOpen(true)} className="font-semibold text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent-hover)]">{triggerLabel}</button>}
    {isOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="terms-acceptance-title" className="flex max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-7">
          <div><p className="catalog-kicker">Consentimiento obligatorio</p><h2 id="terms-acceptance-title" className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">{title}</h2></div>
          {!openOnMount && <button type="button" onClick={() => setIsOpen(false)} className="rounded-full px-2 text-2xl leading-none text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]" aria-label="Cerrar términos">×</button>}
        </div>
        <div onScroll={handleScroll} tabIndex={0} className="mx-5 my-4 max-h-96 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-4 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:mx-7" aria-label="Términos y condiciones, desplázate hasta el final">
          {children}
        </div>
        <div className="border-t border-[var(--border)] px-5 py-4 sm:px-7">
          <p className={`text-[12px] font-medium ${hasScrolledToBottom ? "text-[var(--status-green)]" : "text-[var(--status-amber)]"}`} role="status">
            {hasScrolledToBottom ? "Lectura completada. Ya puedes aceptar." : "Debes leer los términos hasta el final para continuar."}
          </p>
          <label className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-[var(--text-secondary)]">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} disabled={!hasScrolledToBottom} className="mt-1 accent-[var(--accent)]" />
            <span>Acepto los Términos y Condiciones de Servicio y Venta y la política de devoluciones.</span>
          </label>
          <button type="button" onClick={submitAcceptance} disabled={submitting || !hasScrolledToBottom || !checked} className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45">{submitting ? "Guardando aceptación..." : buttonLabel}</button>
        </div>
      </section>
    </div>}
  </>;
}
