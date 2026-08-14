import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[var(--bg-secondary)] px-6 py-20">
      <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--accent-light)] blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-white blur-3xl" />

      <section className="relative w-full max-w-xl text-center">
        <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-70" aria-label="J14 Celulares, inicio">
          <Image src="/J14_Icono_Azul.jpg" alt="" width={34} height={34} className="rounded-full" priority />
          J14 Celulares
        </Link>
        <p className="text-[clamp(7rem,25vw,13rem)] font-bold leading-[.78] tracking-[-.09em] text-[var(--accent)]">404</p>
        <div className="mx-auto mt-10 max-w-md">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[var(--text-tertiary)]">Señal perdida</p>
          <h1 className="text-display mb-4">Esta página tomó otra ruta.</h1>
          <p className="text-body-lg text-[var(--text-secondary)]">No encontramos lo que buscabas, pero todavía puedes volver al catálogo o consultar tu reparación.</p>
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Volver al inicio</Link>
          <Link href="/catalogo" className="btn-secondary">Ver catálogo</Link>
        </div>
      </section>
    </main>
  );
}
