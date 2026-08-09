"use client";

import { useState } from "react";
import TermsAcceptanceModal from "@/components/legal/TermsAcceptanceModal";
import TermsContent from "@/components/legal/TermsContent";
import { acceptClientTermsAction } from "@/lib/actions/auth";

export default function AcceptTermsClient() {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function accept() {
    setSaving(true);
    setError("");
    let result: Awaited<ReturnType<typeof acceptClientTermsAction>>;
    try {
      result = await acceptClientTermsAction();
    } catch {
      setSaving(false);
      setError("No pudimos guardar tu aceptación. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (result.error) {
      setSaving(false);
      setError(result.error.message);
      throw new Error(result.error.message);
    }
    window.location.assign("/cliente/completar-perfil");
  }

  return <>
    <TermsAcceptanceModal onAccept={accept} openOnMount buttonLabel={saving ? "Guardando aceptación..." : "Acepto los Términos y Condiciones"}>
      <TermsContent />
    </TermsAcceptanceModal>
    {error && <p role="alert" className="fixed bottom-5 left-1/2 z-[110] w-[min(92vw,480px)] -translate-x-1/2 rounded-[var(--radius-sm)] bg-red-50 px-4 py-3 text-[13px] text-[var(--status-red)] shadow-[var(--shadow-md)]">{error}</p>}
  </>;
}
