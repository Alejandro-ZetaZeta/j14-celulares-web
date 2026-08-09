"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreditCardRate } from "@/types/database";
import {
  createCreditCardRate,
  updateCreditCardRate,
  deleteCreditCardRate,
} from "@/lib/actions/credit-card-rates";

interface FinanciamientoClientProps {
  rates: CreditCardRate[];
}

export default function FinanciamientoClient({ rates }: FinanciamientoClientProps) {
  const router = useRouter();
  const [newMonths, setNewMonths] = useState("");
  const [newMultiplier, setNewMultiplier] = useState("1.000");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const months = parseInt(newMonths, 10);
    const multiplier = parseFloat(newMultiplier);

    if (!months || months < 1) {
      setError("Ingresa un número válido de meses.");
      return;
    }
    if (Number.isNaN(multiplier) || multiplier < 1) {
      setError("El multiplicador debe ser mayor o igual a 1.");
      return;
    }

    setAdding(true);
    try {
      await createCreditCardRate(months, multiplier);
      setNewMonths("");
      setNewMultiplier("1.000");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar la tasa.");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(
    id: string,
    multiplier: number,
    active: boolean
  ) {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await updateCreditCardRate(id, { interest_multiplier: multiplier, active });
      router.refresh();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta tasa de financiamiento?")) return;
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await deleteCreditCardRate(id);
      router.refresh();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Financiamiento</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Administra los plazos y multiplicadores de interés que ven los clientes en el simulador de cuotas.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-[var(--radius-md)] px-4 py-3 text-[14px] mb-6">
          {error}
        </div>
      )}

      <section className="card-apple p-6 hover:!transform-none mb-8">
        <h2 className="text-[16px] font-semibold mb-4">Agregar nuevo plazo</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label htmlFor="new-months" className="text-[14px] font-medium">Meses</label>
            <input
              id="new-months"
              type="number"
              min={1}
              step={1}
              value={newMonths}
              onChange={(e) => setNewMonths(e.target.value)}
              placeholder="12"
              required
              className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label htmlFor="new-multiplier" className="text-[14px] font-medium">Multiplicador de interés</label>
            <input
              id="new-multiplier"
              type="number"
              min={1}
              step={0.001}
              value={newMultiplier}
              onChange={(e) => setNewMultiplier(e.target.value)}
              placeholder="1.135"
              required
              className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="btn-primary disabled:opacity-60 w-full sm:w-auto"
          >
            {adding ? "Agregando..." : "Agregar"}
          </button>
        </form>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-3">
          Ejemplo: 12 meses con multiplicador 1.135 significa que el precio se multiplica por 1.135 y se divide en 12 cuotas.
        </p>
      </section>

      <section className="card-apple overflow-hidden hover:!transform-none">
        {rates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[17px] font-semibold text-[var(--text-primary)] mb-1">Sin tasas configuradas</p>
            <p className="text-caption">Agrega al menos un plazo para activar el simulador de cuotas.</p>
          </div>
        ) : (
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">Meses</th>
                <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">Multiplicador</th>
                <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">Activo</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const isPending = pendingIds.has(rate.id);
                return (
                  <RateRow
                    key={rate.id}
                    rate={rate}
                    disabled={isPending}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

interface RateRowProps {
  rate: CreditCardRate;
  disabled: boolean;
  onUpdate: (id: string, multiplier: number, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function RateRow({ rate, disabled, onUpdate, onDelete }: RateRowProps) {
  const [multiplier, setMultiplier] = useState(String(rate.interest_multiplier));
  const [active, setActive] = useState(rate.active);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    parseFloat(multiplier) !== rate.interest_multiplier || active !== rate.active;

  async function handleSave() {
    const value = parseFloat(multiplier);
    if (Number.isNaN(value) || value < 1) return;
    setSaving(true);
    await onUpdate(rate.id, value, active);
    setSaving(false);
  }

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="px-5 py-4 align-middle">
        <span className="font-semibold text-[var(--text-primary)]">{rate.months}</span>
      </td>
      <td className="px-5 py-4 align-middle">
        <input
          type="number"
          min={1}
          step={0.001}
          value={multiplier}
          disabled={disabled || saving}
          onChange={(e) => setMultiplier(e.target.value)}
          className="w-28 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60"
        />
      </td>
      <td className="px-5 py-4 align-middle text-center">
        <input
          type="checkbox"
          checked={active}
          disabled={disabled || saving}
          onChange={(e) => setActive(e.target.checked)}
          className="w-5 h-5 accent-[var(--accent)] disabled:opacity-60"
        />
      </td>
      <td className="px-5 py-4 align-middle text-right">
        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled || saving}
              className="text-[13px] font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(rate.id)}
            disabled={disabled || saving}
            className="text-[13px] font-medium text-[var(--status-red)] hover:underline disabled:opacity-60"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
