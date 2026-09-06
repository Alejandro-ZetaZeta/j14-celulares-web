"use client";

import { useState } from "react";
import { updateServiceSteps } from "@/lib/actions/site-settings";
import type { HowItWorksStep } from "@/lib/site-settings";

const inputClass = "mt-2 block w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-3 py-2.5 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function ServiceStepsEditor({ initialSteps }: { initialSteps: HowItWorksStep[] }) {
  const [steps, setSteps] = useState(initialSteps);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function patch(index: number, update: Partial<HowItWorksStep>) {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, ...update } : step));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  function addStep() {
    if (steps.length >= 12) return;
    setSteps((current) => [...current, { id: `step-${crypto.randomUUID()}`, title: "Nuevo paso", description: "Describe esta etapa del servicio técnico.", visible: true }]);
  }
  async function save() {
    setSaving(true); setMessage("");
    try { await updateServiceSteps(steps); setMessage("Pasos guardados y publicados."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudieron guardar los pasos."); }
    finally { setSaving(false); }
  }

  return <section className="card-apple space-y-5 p-6 hover:!transform-none">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="catalog-kicker">Contenido público</p><h2 className="mt-1 text-[21px] font-bold">¿Cómo funciona?</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">Admin y servicio técnico pueden agregar, ordenar, ocultar o editar tarjetas. Visitantes solo ven tarjetas visibles.</p></div><button type="button" onClick={addStep} disabled={steps.length >= 12} className="btn-secondary disabled:opacity-50">+ Agregar tarjeta</button></div>
    <div className="grid gap-4 md:grid-cols-2">{steps.map((step, index) => <div key={step.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4"><div className="flex items-center justify-between gap-3"><span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Paso {index + 1}</span><div className="flex items-center gap-2"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir tarjeta" className="rounded border px-2 py-1 disabled:opacity-30">↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === steps.length - 1} aria-label="Bajar tarjeta" className="rounded border px-2 py-1 disabled:opacity-30">↓</button><button type="button" onClick={() => setSteps((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)} disabled={steps.length <= 1} className="text-[12px] text-red-600 disabled:opacity-30">Eliminar</button></div></div><label className="mt-4 block text-[13px] font-semibold">Título<input value={step.title} maxLength={100} onChange={(event) => patch(index, { title: event.target.value })} className={inputClass} /></label><label className="mt-3 block text-[13px] font-semibold">Descripción<textarea value={step.description} maxLength={500} rows={4} onChange={(event) => patch(index, { description: event.target.value })} className={inputClass} /></label><label className="mt-3 flex items-center gap-2 text-[13px] text-[var(--text-secondary)]"><input type="checkbox" checked={step.visible} onChange={(event) => patch(index, { visible: event.target.checked })} /> Mostrar en página pública</label></div>)}</div>
    <div className="flex flex-wrap items-center gap-4"><button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Guardando..." : "Guardar tarjetas"}</button>{message && <p role="status" className="text-[13px] text-[var(--text-secondary)]">{message}</p>}</div>
  </section>;
}
