"use client";

import { useState } from "react";
import { getTicketMessages } from "@/lib/actions/ticket-chat";
import { signOutAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ChatDrawer from "@/components/service/ChatDrawer";
import TicketStatus from "@/components/service/TicketStatus";
import type { AppRole, TechnicalService, TicketMessage } from "@/types/database";

export default function ClientDashboard({ profile, tickets, userId, unreadCounts }: { profile: { full_name: string | null; phone: string | null }; tickets: TechnicalService[]; userId: string; unreadCounts: Record<string, number> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<TechnicalService | null>(null);
  const [initialMessages, setInitialMessages] = useState<TicketMessage[]>([]);

  async function openChat(ticket: TechnicalService) {
    setSelected(ticket);
    setInitialMessages([]);
    const messages = await getTicketMessages(ticket.id).catch(() => [] as TicketMessage[]);
    setInitialMessages(messages);
  }

  async function logout() {
    await signOutAction();
    router.replace("/cliente/login");
    router.refresh();
  }

  return <main className="min-h-screen bg-[var(--bg-secondary)]"><header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4"><Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Volver al inicio"><Image src="/J14_Icono_Azul.jpg" alt="J14 Celulares" width={32} height={32} className="rounded-[10px]" /><span className="hidden text-[14px] font-bold text-[var(--text-primary)] sm:inline">J14 Celulares</span></Link><nav className="hidden items-center gap-5 text-[13px] font-semibold text-[var(--text-secondary)] md:flex" aria-label="Navegación de cuenta"><Link href="/" className="transition-colors hover:text-[var(--accent)]">Inicio</Link><Link href="/catalogo" className="transition-colors hover:text-[var(--accent)]">Catálogo</Link><Link href="/servicio-tecnico" className="transition-colors hover:text-[var(--accent)]">Consultar ticket</Link></nav><div className="flex items-center gap-3"><span className="hidden text-[12px] text-[var(--text-tertiary)] sm:inline">Sesión activa</span><button type="button" onClick={logout} className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--text-secondary)] transition hover:border-[var(--status-red)] hover:text-[var(--status-red)]">Salir</button></div></div></header><div className="px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1080px]">
     <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Área Cliente</p><h1 className="text-[34px] font-bold tracking-[-0.04em] text-[var(--text-primary)]">Hola, {profile.full_name?.split(" ")[0] ?? "cliente"}.</h1><p className="mt-2 text-[15px] text-[var(--text-secondary)]">Aquí vive el estado de tus equipos y conversaciones.</p></div><button type="button" onClick={logout} className="text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--status-red)]">Cerrar sesión</button></div>
    <div className="mb-8 grid gap-4 sm:grid-cols-2"><div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">Perfil</p><p className="mt-2 text-[17px] font-semibold text-[var(--text-primary)]">{profile.full_name}</p><p className="mt-1 text-[14px] text-[var(--text-secondary)]">{profile.phone}</p></div><div className="rounded-[22px] bg-[var(--bg-dark)] p-5 text-white shadow-[var(--shadow-sm)]"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">Equipos activos</p><p className="mt-2 text-[32px] font-bold">{tickets.length}</p><p className="text-[13px] text-white/60">Seguimiento técnico vinculado a tu cuenta</p></div></div>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-[21px] font-bold text-[var(--text-primary)]">Historial de equipos</h2><span className="text-[13px] text-[var(--text-tertiary)]">{tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}</span></div>{tickets.length === 0 ? <div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-14 text-center"><p className="text-[17px] font-semibold text-[var(--text-primary)]">Todavía no hay equipos vinculados</p><p className="mt-2 text-[14px] text-[var(--text-secondary)]">Cuando dejes un equipo en tienda, soporte lo asociará a tu cuenta.</p></div> : <div className="flex flex-col gap-5">{tickets.map((ticket) => <div key={ticket.id} className="relative rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[12px] font-bold text-[var(--accent)]">{ticket.ticket_id}</p><h3 className="mt-1 text-[18px] font-bold text-[var(--text-primary)]">{ticket.device}</h3></div><button type="button" onClick={() => openChat(ticket)} className="relative flex items-center gap-2 rounded-full bg-[var(--accent-light)] px-4 py-2 text-[13px] font-bold text-[var(--accent)] hover:bg-[#d7e8fb]">Chat {unreadCounts[ticket.id] ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] text-white">{unreadCounts[ticket.id]}</span> : null}</button></div><TicketStatus initialTicket={ticket} /></div>)}</div>}</section>
   </div></div><ChatDrawer key={selected?.id ?? "closed"} open={Boolean(selected)} onClose={() => setSelected(null)} ticket={selected} initialMessages={initialMessages} currentUserId={userId} currentRole={"client" as AppRole} otherPartyName="Soporte Técnico" /></main>;
}
