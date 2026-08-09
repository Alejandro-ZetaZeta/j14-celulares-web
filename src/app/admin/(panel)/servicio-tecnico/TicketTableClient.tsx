"use client";

import { useEffect, useState } from "react";
import { getClientProfiles, linkTicketToClient, markReadyForDelivery, updateTicketStatus } from "@/lib/actions/admin-service";
import { clearTicketChat, getTicketMessages, getUnreadTicketMessageCounts } from "@/lib/actions/ticket-chat";
import ChatDrawer from "@/components/service/ChatDrawer";
import type { AppRole, TechnicalService, TechnicalServiceWithProfile, TicketMessage } from "@/types/database";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  received:           { label: "Recibido",           color: "#86868B", bg: "#F5F5F7" },
  under_diagnosis:    { label: "En Diagnóstico",     color: "#FF9F0A", bg: "#FFF8EC" },
  ready_for_delivery: { label: "Listo para Entrega", color: "#34C759", bg: "#F0FBF4" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "received", label: "Recibidos" },
  { value: "under_diagnosis", label: "En Diagnóstico" },
  { value: "ready_for_delivery", label: "Listos" },
];

export default function TicketTableClient({
  initialTickets,
  currentUserId,
  currentRole,
}: {
  initialTickets: TechnicalServiceWithProfile[];
  currentUserId: string;
  currentRole: AppRole;
}) {
  const [tickets, setTickets] = useState<TechnicalServiceWithProfile[]>(initialTickets);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [clearingChat, setClearingChat] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; phone: string | null; role: AppRole }>>([]);
  const [selected, setSelected] = useState<TechnicalServiceWithProfile | null>(null);
  const [initialMessages, setInitialMessages] = useState<TicketMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void getUnreadTicketMessageCounts(initialTickets.map((ticket) => ticket.id)).then(setUnreadCounts).catch(() => undefined);
    void getClientProfiles().then(setProfiles).catch(() => undefined);
  }, [initialTickets]);

  const filtered = filterStatus === "all"
    ? tickets
    : tickets.filter((t) => t.status === filterStatus);

  async function handleStatusUpdate(id: string, updates: Partial<Pick<TechnicalService, "status" | "progressing" | "current_details">>) {
    setSaving(id);
    await updateTicketStatus(id, updates);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setSaving(null);
  }

  async function handleMarkReady(id: string) {
    setSaving(id);
    await markReadyForDelivery(id);
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "ready_for_delivery", progressing: false } : t))
    );
    setSaving(null);
  }

  async function openChat(ticket: TechnicalServiceWithProfile) {
    setSelected(ticket);
    setInitialMessages(await getTicketMessages(ticket.id).catch(() => []));
  }

  async function handleClearChat(ticket: TechnicalServiceWithProfile) {
    if (!window.confirm("¿Limpiar todos los mensajes de este ticket? Esta acción no se puede deshacer.")) return;
    setClearingChat(ticket.id);
    try {
      await clearTicketChat(ticket.id);
      setUnreadCounts((current) => ({ ...current, [ticket.id]: 0 }));
      if (selected?.id === ticket.id) {
        setSelected(null);
        setInitialMessages([]);
      }
    } finally {
      setClearingChat(null);
    }
  }

  async function attachClient(ticket: TechnicalServiceWithProfile, userId: string) {
    setSaving(ticket.id);
    await linkTicketToClient(ticket.id, userId || null);
    const clientProfile = profiles.find((profile) => profile.id === userId) ?? null;
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, user_id: userId || null, client_profile: clientProfile } : item));
    setSaving(null);
  }

  return (
    <>
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`ticket-filter-${opt.value}`}
            onClick={() => setFilterStatus(opt.value)}
            className={`chip ${filterStatus === opt.value ? "active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-apple p-10 text-center hover:!transform-none">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Sin tickets</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const statusStyle = STATUS_LABELS[ticket.status];
            const clientContact = ticket.client_profile?.phone || ticket.client_contact;

            return (
              <div key={ticket.id} className="card-apple hover:!transform-none overflow-visible">
                {/* Row summary */}
                <button
                  id={`ticket-row-${ticket.id}`}
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--bg-secondary)] transition-colors rounded-[var(--radius-lg)]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[14px] font-bold text-[var(--text-primary)]">{ticket.ticket_id}</span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                     <p className="text-[13px] text-[var(--text-secondary)]">{ticket.device} — {ticket.client_profile?.full_name ?? ticket.client_name}</p>
                   </div>
                   <div className="flex items-center gap-3"><span className="relative text-[18px] text-[var(--text-tertiary)]">{isExpanded ? "▲" : "▼"}{unreadCounts[ticket.id] ? <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">{unreadCounts[ticket.id]}</span> : null}</span></div>
                </button>

                {/* Expanded edit section */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 flex flex-col gap-4">
                    {/* Status selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["received", "under_diagnosis", "ready_for_delivery"] as const).map((s) => (
                        <button
                          key={s}
                          id={`set-status-${ticket.id}-${s}`}
                          disabled={ticket.status === s || saving === ticket.id}
                          onClick={() => s === "ready_for_delivery" ? handleMarkReady(ticket.id) : handleStatusUpdate(ticket.id, { status: s })}
                          className={`py-2 rounded-[var(--radius-md)] text-[13px] font-semibold border transition-all ${
                            ticket.status === s
                              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
                              : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          } disabled:opacity-50`}
                        >
                          {STATUS_LABELS[s].label}
                        </button>
                      ))}
                    </div>

                    {/* Progressing toggle (only for under_diagnosis) */}
                    {ticket.status === "under_diagnosis" && (
                      <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
                        <span className="text-[14px] font-medium">
                          {ticket.progressing ? "🟢 Avanzando" : "🟡 En espera"}
                        </span>
                        <button
                          id={`toggle-progressing-${ticket.id}`}
                          disabled={saving === ticket.id}
                          onClick={() => handleStatusUpdate(ticket.id, { progressing: !ticket.progressing })}
                           className={`relative h-6 w-11 rounded-full transition-colors ${ticket.progressing ? "bg-[var(--status-green)]" : "bg-[var(--border-strong)]"}`}
                          aria-checked={ticket.progressing}
                          role="switch"
                        >
                           <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${ticket.progressing ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    )}

                    {/* Current details textarea */}
                     <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-secondary)]">Detalles actuales (visible al cliente)</label>
                      <textarea
                        id={`details-${ticket.id}`}
                        defaultValue={ticket.current_details}
                        rows={2}
                        onBlur={(e) => {
                          if (e.target.value !== ticket.current_details) {
                            handleStatusUpdate(ticket.id, { current_details: e.target.value });
                          }
                        }}
                        placeholder="Ej. Cambiando pin de carga..."
                        className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                      />
                     </div>

                     <div className="flex flex-col gap-1.5">
                       <label htmlFor={`client-${ticket.id}`} className="text-[13px] font-medium text-[var(--text-secondary)]">Cliente registrado</label>
                       <select id={`client-${ticket.id}`} value={ticket.user_id ?? ""} disabled={saving === ticket.id} onChange={(event) => attachClient(ticket, event.target.value)} className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                         <option value="">Sin cuenta vinculada</option>
                         {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || "Sin nombre"} {profile.phone ? `— ${profile.phone}` : ""}</option>)}
                       </select>
                        <p className="text-[12px] text-[var(--text-secondary)]">{ticket.client_profile?.full_name ?? ticket.client_name} · {clientContact || "Sin teléfono"}</p>
                     </div>

                     <div className="flex flex-wrap items-center gap-2">
                       <button type="button" onClick={() => openChat(ticket)} className="flex w-fit items-center gap-2 rounded-full bg-[var(--accent-light)] px-4 py-2 text-[13px] font-semibold text-[var(--accent)]">Abrir chat {unreadCounts[ticket.id] ? <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[11px] text-white">{unreadCounts[ticket.id]}</span> : null}</button>
                       {currentRole === "admin" && <button type="button" onClick={() => handleClearChat(ticket)} disabled={clearingChat === ticket.id} className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--status-red)] hover:text-[var(--status-red)] disabled:opacity-50">{clearingChat === ticket.id ? "Limpiando..." : "Limpiar chat"}</button>}
                     </div>

                    {saving === ticket.id && (
                      <p className="text-[12px] text-[var(--accent)] animate-pulse">Guardando...</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
        <ChatDrawer key={selected?.id ?? "closed"} open={Boolean(selected)} onClose={() => setSelected(null)} ticket={selected} initialMessages={initialMessages} currentUserId={currentUserId} currentRole={currentRole} otherPartyName={selected?.client_profile?.full_name ?? selected?.client_name ?? "Cliente"} />
    </>
  );
}
