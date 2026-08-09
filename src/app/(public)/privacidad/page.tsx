import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | Celulares J14",
  description: "Información sobre tratamiento de datos personales en Celulares J14.",
};

export default function PrivacyPage() {
  return (
    <main className="container-wide px-5 pb-24 pt-28">
      <div className="mx-auto max-w-3xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10">
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
    </main>
  );
}
