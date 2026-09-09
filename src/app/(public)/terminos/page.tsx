import Link from "next/link";
import Image from "next/image";
import TermsContent from "@/components/legal/TermsContent";

export const metadata = {
  title: "Términos y Condiciones | Celulares J14",
  description: "Términos y condiciones de servicio y venta de Celulares J14.",
};

export default function TermsPage() {
  return (
    <main className="container-wide px-5 pb-24 pt-6">
      <div className="mx-auto flex max-w-8xl flex-col items-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        {/* Mobile-only image */}
        <Image
          src="/PROTECCIÓN.png"
          alt="Protección"
          width={320}
          height={240}
          className="mb-10 h-auto w-[min(260px,60vw)] object-contain select-none lg:hidden"
          priority
        />
        <div className="w-full lg:order-1">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10 lg:p-14">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
              <Link href="/catalogo" className="text-[14px] font-semibold text-[var(--accent)] hover:underline">← Volver al catálogo</Link>
              <Link href="/privacidad" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:underline">Ver política de privacidad</Link>
            </div>
            <TermsContent />
          </div>
        </div>
        {/* Desktop-only image, right side, sticky */}
        <Image
          src="/PROTECCIÓN.png"
          alt="Protección"
          width={320}
          height={240}
          className="sticky top-6 hidden h-auto w-[min(260px,20vw)] translate-x-20 object-contain select-none lg:order-2 lg:mr-1 lg:block"
          priority
        />
      </div>
    </main>
  );
}
