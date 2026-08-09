"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CreditCardRate } from "@/types/database";

const IVA_RATE = 0.15;

interface FinancingSimulatorProps {
  price: number;
  rates: CreditCardRate[];
  onTermsChange?: (months: number | null, installment: number | null) => void;
  className?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function FinancingSimulator({
  price,
  rates,
  onTermsChange,
  className = "",
}: FinancingSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);

  const activeRates = useMemo(
    () => rates.filter((r) => r.active).sort((a, b) => a.months - b.months),
    [rates]
  );

  const selectedRate = activeRates.find((r) => r.months === selectedMonths);

  const installment = useMemo(() => {
    if (!selectedRate || price <= 0) return null;
    return (price * (1 + IVA_RATE) * selectedRate.interest_multiplier) / selectedRate.months;
  }, [selectedRate, price]);

  useEffect(() => {
    onTermsChange?.(selectedMonths, installment);
  }, [selectedMonths, installment, onTermsChange]);

  if (activeRates.length === 0 || price <= 0) return null;

  function handleSelect(months: number) {
    setSelectedMonths((prev) => (prev === months ? null : months));
  }

  return (
    <div className={`border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="financing-panel"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[18px]" aria-hidden="true">💳</span>
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Calcular cuotas con tarjeta</p>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Simula el pago mensual antes de escribirnos
            </p>
          </div>
        </div>
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-[var(--text-tertiary)] flex-shrink-0"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="financing-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              <p className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Selecciona los meses
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {activeRates.map((rate) => (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => handleSelect(rate.months)}
                    className={`chip ${selectedMonths === rate.months ? "active" : ""}`}
                    aria-pressed={selectedMonths === rate.months}
                  >
                    {rate.months} meses
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {installment !== null && selectedRate && (
                  <motion.div
                    key={selectedRate.months}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-4"
                  >
                    <p className="text-[13px] text-[var(--text-secondary)] mb-1">
                      {selectedRate.months} cuotas de aproximadamente
                    </p>
                    <p className="text-[2rem] font-light text-[var(--text-primary)] tracking-tight">
                      {formatPrice(installment)}
                    </p>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                      IVA incluido · Multiplicador: {selectedRate.interest_multiplier}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {installment === null && (
                <p className="text-[13px] text-[var(--text-tertiary)] italic">
                  Elige un plazo para ver el valor mensual.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
