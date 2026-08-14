"use client";

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] px-6 py-20">
          <section className="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-lg)] sm:p-12">
            <p className="mb-4 text-4xl font-bold tracking-[-.06em] text-[var(--accent)]">J14</p>
            <h1 className="text-headline mb-4">La conexión se interrumpió.</h1>
            <p className="text-body-lg text-[var(--text-secondary)]">Hubo un problema al cargar la tienda. Revisa tu conexión e intenta otra vez.</p>
            <button type="button" onClick={() => reset()} className="btn-primary mt-8">Reintentar</button>
          </section>
        </main>
      </body>
    </html>
  );
}
