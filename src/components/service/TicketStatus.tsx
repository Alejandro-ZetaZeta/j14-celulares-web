"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTicketByCode } from "@/lib/actions/service";
import type { TechnicalService } from "@/types/database";

const STATUS_STEPS = [
  {
    key: "received",
    label: "Recibido",
    sublabel: "En cola de espera",
    icon: "📋",
  },
  {
    key: "under_diagnosis",
    label: "En Diagnóstico",
    sublabel: "Revisión técnica activa",
    icon: "🔬",
  },
  {
    key: "ready_for_delivery",
    label: "Listo para Entrega",
    sublabel: "Equipo reparado y probado",
    icon: "✅",
  },
  {
    key: "delivered",
    label: "Entregado",
    sublabel: "Equipo retirado por el cliente",
    icon: "📦",
  },
];

const STATUS_ORDER = ["received", "under_diagnosis", "ready_for_delivery", "delivered"];
const POLL_INTERVAL_MS = 30_000; // Poll every 30 seconds
const TERMINAL_STATUS = "delivered";

interface TicketStatusProps {
  initialTicket: TechnicalService;
}

export default function TicketStatus({ initialTicket }: TicketStatusProps) {
  const [ticket, setTicket] = useState<TechnicalService>(initialTicket);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling-based real-time updates (InsForge SDK does not expose a channel/subscribe API)
  useEffect(() => {
    if (ticket.status === TERMINAL_STATUS) return;

    intervalRef.current = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const updated = await getTicketByCode(ticket.ticket_id);
      if (!updated) return;
      setTicket(updated);
      setLastUpdated(new Date());
      if (updated.status === TERMINAL_STATUS && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ticket.status, ticket.ticket_id]);

  const currentIndex = STATUS_ORDER.indexOf(ticket.status);
  const isReady = ticket.status === "ready_for_delivery";
  const isDelivered = ticket.status === "delivered";
  const isDiagnosis = ticket.status === "under_diagnosis";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={`Estado del ticket ${ticket.ticket_id}`}
    >
      {/* Header */}
      <div className={`px-4 py-6 sm:px-8 ${isDelivered ? "bg-gradient-to-r from-[#8E8CF7]/10 to-[#6B69D6]/5" : isReady ? "bg-gradient-to-r from-[#34C759]/10 to-[#30D158]/5" : "section-gray"} border-b border-[var(--border)]`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
              Ticket
            </p>
            <p className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight font-mono">
              {ticket.ticket_id}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[12px] text-[var(--text-tertiary)] mb-1">Dispositivo</p>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">{ticket.device}</p>
            <p className="text-[13px] text-[var(--text-secondary)]">{ticket.client_name}</p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="px-4 py-8 sm:px-8">
        <ol className="relative" aria-label="Progreso de reparación">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <li key={step.key} className="flex gap-5 pb-8 last:pb-0">
                {/* Step indicator column */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted
                        ? "#34C759"
                        : isCurrent
                        ? (isDelivered ? "#8E8CF7" : "#0071E3")
                        : "#E5E5EA",
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] flex-shrink-0"
                    aria-hidden="true"
                  >
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </motion.div>

                  {/* Connector line */}
                  {index < STATUS_STEPS.length - 1 && (
                    <motion.div
                      initial={false}
                      animate={{ backgroundColor: isCompleted ? "#34C759" : "#E5E5EA" }}
                      className="w-0.5 flex-1 mt-1"
                      style={{ minHeight: "32px" }}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="pt-1 pb-2 flex-1 min-w-0">
                  <p
                    className={`text-[16px] font-semibold mb-0.5 ${
                      isCurrent ? "text-[var(--text-primary)]" : isCompleted ? "text-[var(--status-green)]" : "text-[var(--text-tertiary)]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[13px] text-[var(--text-tertiary)] mb-3">{step.sublabel}</p>

                  {/* Under Diagnosis: progressing / detenido badge */}
                  {isCurrent && isDiagnosis && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold ${
                        ticket.progressing
                          ? "bg-[var(--status-green)]/10 text-[var(--status-green)]"
                          : "bg-[var(--status-amber)]/10 text-[var(--status-amber)]"
                      }`}
                    >
                      <span className={`status-dot ${ticket.progressing ? "green" : "amber"}`} />
                      {ticket.progressing ? "Avanzando" : "En espera"}
                    </motion.div>
                  )}

                  {/* Current details */}
                  {isCurrent && ticket.current_details && (
                    <AnimatePresence>
                      <motion.p
                        key={ticket.current_details}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-[14px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-[var(--radius-md)] px-4 py-3 border border-[var(--border)]"
                      >
                        🛠 <span className="font-medium">Estado actual:</span> {ticket.current_details}
                      </motion.p>
                    </AnimatePresence>
                  )}

                  {/* Ready for delivery celebration */}
                  {isCurrent && isReady && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 bg-[var(--status-green)]/10 border border-[var(--status-green)]/30 rounded-[var(--radius-md)] px-4 py-3"
                    >
                      <p className="text-[14px] font-semibold text-[var(--status-green)]">
                        🎉 ¡Tu equipo está listo! Puedes pasar a recogerlo.
                      </p>
                    </motion.div>
                  )}

                  {/* Delivered confirmation */}
                  {isCurrent && isDelivered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 bg-[#8E8CF7]/10 border border-[#8E8CF7]/30 rounded-[var(--radius-md)] px-4 py-3"
                    >
                      <p className="text-[14px] font-semibold text-[#6B69D6]">
                        📦 ¡Equipo entregado! Gracias por confiar en nosotros.
                      </p>
                    </motion.div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-4 section-gray border-t border-[var(--border)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-[12px] text-[var(--text-tertiary)]">
          Ingreso: {new Date(ticket.entry_date).toLocaleDateString("es-EC", { dateStyle: "medium" })}
        </p>
        {isDelivered ? (
          <p className="text-[12px] font-semibold text-[#8E8CF7]">✓ Ticket cerrado</p>
        ) : (
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
            Actualizado {lastUpdated.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} · cada 30s
          </div>
        )}
      </div>
    </motion.div>
  );
}
