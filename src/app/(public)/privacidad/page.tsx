import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Política de Privacidad | Celulares J14",
  description: "Información sobre tratamiento de datos personales en Celulares J14.",
};

export default function PrivacyPage() {
  return (
<main className="container-wide px-5 pb-24 pt-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center lg:grid lg:max-w-6xl lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        {/* Mobile-only image */}
        <Image
          src="/PROTECCIÓN.png"
          alt="Protección"
          width={320}
          height={240}
          className="mb-8 h-auto w-[min(260px,60vw)] object-contain select-none lg:hidden"
          priority
        />
        {/* Desktop-only image, left side, sticky */}
        <Image
          src="/PROTECCIÓN.png"
          alt="Protección"
          width={320}
          height={240}
          className="sticky top-6 hidden h-auto w-[min(260px,20vw)] -translate-x-20 object-contain select-none lg:order-1 lg:block"
          priority
        />
        <div className="mx-auto w-full max-w-3xl lg:order-2 lg:max-w-none">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10">
            <Link href="/terminos" className="text-[14px] font-semibold text-[var(--accent)] hover:underline">← Ver términos y condiciones</Link>
            <p className="catalog-kicker mt-10">Documento legal</p>
            <h1 className="mt-2 text-display">Política de Privacidad</h1>
            <div className="mt-8 space-y-5 text-[15px] leading-7 text-[var(--text-secondary)]">
              <p>Celulares J14 trata datos personales para administrar cuentas, pedidos, pagos, facturación, entregas, garantías, soporte y comunicaciones relacionadas con nuestros servicios.</p>
              <h2 className="text-[21px] font-bold text-[var(--text-primary)]">Tus derechos</h2>
              <p>Puedes solicitar acceso, rectificación, actualización, eliminación, oposición, portabilidad y demás derechos reconocidos por la Ley Orgánica de Protección de Datos Personales del Ecuador mediante los canales oficiales de atención.</p>
              <h2 className="text-[21px] font-bold text-[var(--text-primary)]">Seguridad y conservación</h2>
              <p>Aplicamos medidas razonables de seguridad y conservamos información durante el tiempo necesario para cumplir finalidades operativas, obligaciones legales y atender reclamos.</p>
              <p>Para conocer las condiciones completas de uso, consulta los <Link href="/terminos" className="font-semibold text-[var(--accent)] hover:underline">Términos y Condiciones</Link>.</p>
            </div>
          </div>
        </div>
        {/* Right spacer column to keep the card centered */}
        <div aria-hidden="true" className="hidden lg:order-3 lg:block" />
      </div>
    </main>
  );
}
