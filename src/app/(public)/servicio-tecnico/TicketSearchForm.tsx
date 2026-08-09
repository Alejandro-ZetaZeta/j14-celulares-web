"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTicketByCode } from "@/lib/actions/service";
import TicketStatus from "@/components/service/TicketStatus";
import type { TechnicalService } from "@/types/database";

export default function TicketSearchForm() {
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<TechnicalService | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketId.trim()) return;

    setLoading(true);
    setNotFound(false);
    setTicket(null);

    const result = await getTicketByCode(ticketId);
    setLoading(false);

    if (result) {
      setTicket(result);
    } else {
      setNotFound(true);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-[500px]" noValidate>
        <div className="flex gap-3">
          <input
            id="ticket-search-input"
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
            placeholder="Ej. ST-20260625-001"
            maxLength={30}
            className="flex-1 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] text-[16px] font-mono placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            aria-label="Número de ticket"
            required
          />
          <button
            type="submit"
            id="ticket-search-submit"
            disabled={loading || !ticketId.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-[100px]"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              "Consultar"
            )}
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {notFound && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-6 w-full max-w-[500px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] px-5 py-4 text-center"
            role="alert"
          >
            <p className="text-2xl mb-1">🔍</p>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ticket no encontrado</p>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
              Verifica el número e intenta de nuevo.
            </p>
          </motion.div>
        )}

        {ticket && (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-8 w-full max-w-[600px]"
          >
            <TicketStatus initialTicket={ticket} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
