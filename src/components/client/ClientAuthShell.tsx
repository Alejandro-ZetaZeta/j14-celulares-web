"use client";

import Image from "next/image";
import Link from "next/link";

export default function ClientAuthShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-[430px]">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--accent)] hover:underline">
          <span aria-hidden="true">←</span> J14 Celulares
        </Link>
        <div className="mb-7 flex items-center gap-3">
          <Image src="/J14_Icono_Azul.jpg" alt="J14 Celulares" width={48} height={48} className="rounded-[15px]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Área Cliente</p>
            <p className="text-[13px] text-[var(--text-tertiary)]">Seguimiento técnico sin llamadas</p>
          </div>
        </div>
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--border)] px-7 pb-6 pt-7">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{eyebrow}</p>
            <h1 className="text-[30px] font-bold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h1>
          </div>
          <div className="px-7 py-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
