import Link from "next/link";
import TermsContent from "@/components/legal/TermsContent";

export const metadata = {
  title: "Términos y Condiciones | Celulares J14",
  description: "Términos y condiciones de servicio y venta de Celulares J14.",
};

export default function TermsPage() {
  return (
    <main className="container-wide px-5 pb-24 pt-28">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/catalogo" className="text-[14px] font-semibold text-[var(--accent)] hover:underline">← Volver al catálogo</Link>
        <Link href="/privacidad" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:underline">Ver política de privacidad</Link>
      </div>
      <div className="mx-auto max-w-4xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10 lg:p-14">
        <TermsContent />
      </div>
    </main>
  );
}
