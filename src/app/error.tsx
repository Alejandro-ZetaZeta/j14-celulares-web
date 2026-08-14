"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-1 items-center justify-center bg-[var(--bg-secondary)] px-6 py-20">
      <section className="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-lg)] sm:p-12">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#FFF1F0] text-2xl text-[var(--status-red)]" aria-hidden="true">!</div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[var(--status-red)]">Algo no salió como esperábamos</p>
        <h1 className="text-headline mb-4">No pudimos cargar esta sección.</h1>
        <p className="text-body-lg text-[var(--text-secondary)]">Puede ser un problema temporal o una conexión inestable. Intenta nuevamente.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-primary">Intentar de nuevo</button>
          <Link href="/" className="btn-secondary">Ir al inicio</Link>
        </div>
      </section>
    </main>
  );
}
