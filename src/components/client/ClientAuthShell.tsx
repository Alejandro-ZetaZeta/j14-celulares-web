"use client";

import Image from "next/image";
import Link from "next/link";

export default function ClientAuthShell({
  eyebrow,
  title,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-10 sm:py-16 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-8">
      <div className={`mx-auto w-full max-w-[430px] ${wide ? "lg:max-w-[1240px]" : "lg:max-w-[1080px]"}`}>
        <div className="lg:hidden">
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
        </div>
        <Link
          href="/"
          className="mb-5 hidden w-fit items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--accent)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] lg:inline-flex"
        >
          <span aria-hidden="true">←</span> Volver al inicio
        </Link>
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="hidden h-[600px] rounded-[28px] bg-[#0A4FB0] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] lg:flex">
            <div className="flex w-full flex-col items-center justify-center gap-6">
              <Image src="/J14_Icono_Azul.jpg" alt="" width={280} height={280} className="rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.28)]" />
              <div className="text-center">
                <p className="text-[34px] font-bold tracking-[-0.03em] text-white">J14 Celulares</p>
                <p className="mt-2 text-[15px] leading-6 text-white/70">Seguimiento técnico sin llamadas</p>
              </div>
            </div>
          </div>
          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] lg:flex lg:h-[600px] lg:flex-col lg:justify-center">
            <div className="auth-enter--header border-b border-[var(--border)] px-7 pb-5 pt-6">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{eyebrow}</p>
              <h1 className="text-[30px] font-bold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h1>
            </div>
            <div className="auth-enter--body px-7 py-6">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
