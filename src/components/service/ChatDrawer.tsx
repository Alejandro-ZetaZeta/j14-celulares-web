"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getTicketMessages, markTicketMessagesRead, sendTicketMessage } from "@/lib/actions/ticket-chat";
import { insforgeBrowser } from "@/lib/insforge-browser";
import type { AppRole, TicketMessage, TechnicalService } from "@/types/database";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  ticket: TechnicalService | null;
  initialMessages: TicketMessage[];
  currentUserId: string;
  currentRole: AppRole;
  otherPartyName: string;
}

function eventMessage(payload: unknown): TicketMessage | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as { payload?: unknown };
  const value = candidate.payload && typeof candidate.payload === "object" ? candidate.payload : payload;
  if (!value || typeof value !== "object") return null;
  const message = value as Partial<TicketMessage>;
  return typeof message.id === "string" && typeof message.message === "string" ? message as TicketMessage : null;
}

export default function ChatDrawer({ open, onClose, ticket, initialMessages, currentUserId, currentRole, otherPartyName }: ChatDrawerProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const channel = ticket ? `ticket:${ticket.id}` : "";

  useEffect(() => {
    if (!open || !ticket) return;
    let mounted = true;
    const listener = (payload: unknown) => {
      const message = eventMessage(payload);
      if (!mounted || !message || message.ticket_id !== ticket.id) return;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    };

    void getTicketMessages(ticket.id)
      .then((loaded) => { if (mounted) setMessages(loaded); })
      .catch((caught) => { if (mounted) setError(caught instanceof Error ? caught.message : "No se pudieron cargar los mensajes."); })
      .finally(() => { if (mounted) setLoadingMessages(false); });
    void insforgeBrowser.realtime.connect().then(() => insforgeBrowser.realtime.subscribe(channel));
    insforgeBrowser.realtime.on("message_created", listener);
    void markTicketMessagesRead(ticket.id).catch(() => undefined);
    return () => {
      mounted = false;
      insforgeBrowser.realtime.off("message_created", listener);
      insforgeBrowser.realtime.unsubscribe(channel);
    };
  }, [channel, open, ticket]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await sendTicketMessage(ticket.id, draft);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  const representative = messages.find((message) => message.sender_role !== "client");
  const canSend = currentRole === "client"
    || !representative
    || (representative.sender_id === currentUserId && representative.sender_role === currentRole);

  return <AnimatePresence>
    {open && ticket && <>
      <motion.button type="button" aria-label="Cerrar chat" className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside role="dialog" aria-modal="true" aria-label={`Chat del ticket ${ticket.ticket_id}`} className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[430px] flex-col bg-[var(--surface)] shadow-[-20px_0_60px_rgba(0,0,0,0.18)]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
        <header className="flex items-start justify-between border-b border-[var(--border)] px-5 py-5">
          <div className="min-w-0"><p className="font-mono text-[12px] font-bold text-[var(--accent)]">{ticket.ticket_id}</p><h2 className="mt-1 truncate text-[18px] font-bold text-[var(--text-primary)]">{ticket.device}</h2><p className="mt-1 text-[13px] text-[var(--text-secondary)]">Chat con {otherPartyName}</p></div>
          <button type="button" onClick={onClose} className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[20px] text-[var(--text-secondary)] hover:bg-[var(--border)]" aria-label="Cerrar">×</button>
        </header>
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg-secondary)] px-4 py-5">
           {loadingMessages ? <div className="mt-12 text-center text-[13px] text-[var(--text-tertiary)]">Cargando mensajes...</div> : messages.length === 0 ? <div className="mt-12 text-center text-[13px] text-[var(--text-tertiary)]">Inicia conversación con soporte técnico.</div> : messages.map((message) => { const isClientMessage = message.sender_role === "client"; const own = message.sender_id === currentUserId; const alignRight = own || (currentRole !== "client" && !isClientMessage); return <div key={message.id} className={`flex ${alignRight ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-[18px] px-4 py-3 text-[14px] leading-5 ${isClientMessage ? "rounded-br-[5px] bg-[#0071E3] text-white" : "rounded-bl-[5px] bg-[#E9E9EB] text-[var(--text-primary)]"}`}><p>{message.message}</p><time className={`mt-1 block text-[10px] ${isClientMessage ? "text-white/65" : "text-[var(--text-tertiary)]"}`}>{new Date(message.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}
        </div>
        <footer className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
          {error && <p role="alert" className="mb-2 text-[12px] text-[var(--status-red)]">{error}</p>}
           {!canSend && <p className="mb-2 text-[12px] text-[var(--text-tertiary)]">Este chat está asignado a otro representante. Puedes revisarlo, pero no participar.</p>}
           <form onSubmit={submit} className="flex items-end gap-2"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!canSend} maxLength={2000} rows={1} placeholder={canSend ? (currentRole === "client" ? "Escribe a soporte..." : "Escribe al cliente...") : "Chat en modo lectura"} className="max-h-28 min-h-[44px] flex-1 resize-none rounded-[15px] border border-[var(--border-strong)] px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]" /><button type="submit" disabled={!canSend || sending || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-40" aria-label="Enviar mensaje">↑</button></form>
        </footer>
      </motion.aside>
    </>}
  </AnimatePresence>;
}
