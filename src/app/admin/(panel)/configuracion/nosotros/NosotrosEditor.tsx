"use client";

import { useState } from "react";
import { updateAboutContent } from "@/lib/actions/site-settings";
import type { AboutBlock, AboutContent, AboutCTA, AboutMilestone, AboutStat, AboutStoryParagraph, AboutValue } from "@/lib/about";

const inputClass = "mt-2 block w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-3 py-2.5 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

function SectionCard({ title, hint, children, onAdd }: { title: string; hint?: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <section className="card-apple space-y-5 p-6 hover:!transform-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold text-[var(--text-primary)]">{title}</h2>
          {hint && <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[var(--text-tertiary)]">{hint}</p>}
        </div>
        {onAdd && <button type="button" onClick={onAdd} className="btn-secondary disabled:opacity-50">+ Agregar</button>}
      </div>
      {children}
    </section>
  );
}

function TextBlockEditor({ label, value, onChange }: { label: string; value: AboutBlock; onChange: (value: AboutBlock) => void }) {
  const isLong = value.text.length > 90;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-start justify-between gap-3">
        <label className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</label>
        <label className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          <input type="checkbox" checked={value.visible} onChange={(event) => onChange({ ...value, visible: event.target.checked })} /> Visible
        </label>
      </div>
      {isLong ? <textarea rows={3} value={value.text} maxLength={500} onChange={(event) => onChange({ ...value, text: event.target.value })} className={inputClass} /> : <input value={value.text} maxLength={500} onChange={(event) => onChange({ ...value, text: event.target.value })} className={inputClass} />}
      <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{value.text.length}/500</p>
    </div>
  );
}

function MoveControls({ index, total, onMove, onRemove, removable }: { index: number; total: number; onMove: (direction: -1 | 1) => void; onRemove: () => void; removable: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Subir" className="rounded border border-[var(--border-strong)] px-2 py-1 disabled:opacity-30">↑</button>
      <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Bajar" className="rounded border border-[var(--border-strong)] px-2 py-1 disabled:opacity-30">↓</button>
      <button type="button" onClick={onRemove} disabled={!removable} className="rounded border border-[var(--border-strong)] px-2 py-1 text-[12px] text-red-600 disabled:opacity-30">Eliminar</button>
    </div>
  );
}

const newId = () => crypto.randomUUID();

export default function NosotrosEditor({ initialContent }: { initialContent: AboutContent }) {
  const [content, setContent] = useState<AboutContent>(initialContent);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function patchHero(update: Partial<AboutContent["hero"]>) {
    setContent((current) => ({ ...current, hero: { ...current.hero, ...update } }));
  }
  function patchStory(update: Partial<AboutContent["story"]>) {
    setContent((current) => ({ ...current, story: { ...current.story, ...update } }));
  }
  function patchMilestones(update: Partial<AboutContent["milestones"]>) {
    setContent((current) => ({ ...current, milestones: { ...current.milestones, ...update } }));
  }
  function patchValues(update: Partial<AboutContent["values"]>) {
    setContent((current) => ({ ...current, values: { ...current.values, ...update } }));
  }
  function patchStats(update: Partial<AboutContent["stats"]>) {
    setContent((current) => ({ ...current, stats: { ...current.stats, ...update } }));
  }

  async function save() {
    setSaving(true); setMessage(""); setError("");
    try {
      await updateAboutContent(content);
      setMessage("Contenido de Nosotros guardado y publicado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el contenido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save(); }}>
      {/* Hero */}
      <SectionCard title="Hero de portada" hint="Sección oscura superior de la página. Titular en tipografía editorial.">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlockEditor label="Kicker" value={content.hero.kicker} onChange={(value) => patchHero({ kicker: value })} />
          <TextBlockEditor label="Titular" value={content.hero.headline} onChange={(value) => patchHero({ headline: value })} />
          <div className="lg:col-span-2"><TextBlockEditor label="Subtítulo" value={content.hero.subhead} onChange={(value) => patchHero({ subhead: value })} /></div>
        </div>
      </SectionCard>

      {/* Manifesto */}
      <SectionCard title="Manifiesto" hint="Declaración central en grande. Aparece justo después del hero.">
        <TextBlockEditor label="Declaración" value={content.manifesto} onChange={(value) => setContent((current) => ({ ...current, manifesto: value }))} />
      </SectionCard>

      {/* Story */}
      <SectionCard title="Nuestra historia" hint="El relato en párrafos. El primero lleva capitular (letra inicial destacada).">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlockEditor label="Título de sección" value={content.story.title} onChange={(value) => patchStory({ title: value })} />
          <TextBlockEditor label="Introducción" value={content.story.intro} onChange={(value) => patchStory({ intro: value })} />
        </div>
        <div className="space-y-3">
          {content.story.paragraphs.map((paragraph, index) => (
            <div key={paragraph.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Párrafo {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><input type="checkbox" checked={paragraph.visible} onChange={(event) => patchParagraph(paragraph.id, { visible: event.target.checked })} /> Visible</label>
                  <MoveControls index={index} total={content.story.paragraphs.length} removable={content.story.paragraphs.length > 1} onMove={(direction) => moveParagraph(index, direction)} onRemove={() => removeParagraph(paragraph.id)} />
                </div>
              </div>
              <textarea rows={4} value={paragraph.text} maxLength={2000} onChange={(event) => patchParagraph(paragraph.id, { text: event.target.value })} className={inputClass} />
              <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{paragraph.text.length}/2000</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Milestones */}
      <SectionCard title="Hitos (línea de tiempo)" hint="Cada hito tiene año, título y descripción. Se ordenan de arriba a abajo.">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlockEditor label="Título de sección" value={content.milestones.title} onChange={(value) => patchMilestones({ title: value })} />
          <TextBlockEditor label="Introducción" value={content.milestones.intro} onChange={(value) => patchMilestones({ intro: value })} />
        </div>
        <div className="space-y-3">
          {content.milestones.items.map((item, index) => (
            <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Hito {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><input type="checkbox" checked={item.visible} onChange={(event) => patchMilestone(item.id, { visible: event.target.checked })} /> Visible</label>
                  <MoveControls index={index} total={content.milestones.items.length} removable={content.milestones.items.length > 1} onMove={(direction) => moveMilestone(index, direction)} onRemove={() => removeMilestone(item.id)} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
                <label className="block text-[13px] font-semibold">Año<input value={item.year} maxLength={20} onChange={(event) => patchMilestone(item.id, { year: event.target.value })} className={inputClass} placeholder="2014" /></label>
                <label className="block text-[13px] font-semibold">Título<input value={item.title} maxLength={120} onChange={(event) => patchMilestone(item.id, { title: event.target.value })} className={inputClass} /></label>
              </div>
              <label className="mt-3 block text-[13px] font-semibold">Descripción<textarea rows={2} value={item.description} maxLength={500} onChange={(event) => patchMilestone(item.id, { description: event.target.value })} className={inputClass} /></label>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Values */}
      <SectionCard title="Valores" hint="Los principios que muestras en tarjetas." onAdd={addValue}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlockEditor label="Título de sección" value={content.values.title} onChange={(value) => patchValues({ title: value })} />
          <TextBlockEditor label="Introducción" value={content.values.intro} onChange={(value) => patchValues({ intro: value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {content.values.items.map((item, index) => (
            <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Valor {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><input type="checkbox" checked={item.visible} onChange={(event) => patchValue(item.id, { visible: event.target.checked })} /> Visible</label>
                  <MoveControls index={index} total={content.values.items.length} removable={content.values.items.length > 1} onMove={(direction) => moveValue(index, direction)} onRemove={() => removeValue(item.id)} />
                </div>
              </div>
              <label className="mt-3 block text-[13px] font-semibold">Título<input value={item.title} maxLength={80} onChange={(event) => patchValue(item.id, { title: event.target.value })} className={inputClass} /></label>
              <label className="mt-3 block text-[13px] font-semibold">Descripción<textarea rows={2} value={item.description} maxLength={500} onChange={(event) => patchValue(item.id, { description: event.target.value })} className={inputClass} /></label>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Stats */}
      <SectionCard title="Cifras" hint="Banda oscura con números grandes. Valor + etiqueta." onAdd={addStat}>
        <TextBlockEditor label="Título de sección" value={content.stats.title} onChange={(value) => patchStats({ title: value })} />
        <div className="grid gap-3 md:grid-cols-2">
          {content.stats.items.map((item, index) => (
            <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Cifra {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><input type="checkbox" checked={item.visible} onChange={(event) => patchStat(item.id, { visible: event.target.checked })} /> Visible</label>
                  <MoveControls index={index} total={content.stats.items.length} removable={content.stats.items.length > 1} onMove={(direction) => moveStat(index, direction)} onRemove={() => removeStat(item.id)} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <label className="block text-[13px] font-semibold">Valor<input value={item.value} maxLength={20} onChange={(event) => patchStat(item.id, { value: event.target.value })} className={inputClass} placeholder="10+" /></label>
                <label className="block text-[13px] font-semibold">Etiqueta<input value={item.label} maxLength={80} onChange={(event) => patchStat(item.id, { label: event.target.value })} className={inputClass} /></label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* CTA */}
      <SectionCard title="Llamado final" hint="Sección de cierre con botón hacia una ruta interna.">
        <CtaEditor value={content.cta} onChange={(value) => setContent((current) => ({ ...current, cta: value }))} />
      </SectionCard>

      {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-[13px] text-[var(--status-red)]">{error}</p>}
      {message && <p role="status" className="rounded-[var(--radius-sm)] bg-green-50 px-3 py-2 text-[13px] text-green-700">{message}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Guardando..." : "Guardar y publicar"}</button>
        <p className="text-[12px] text-[var(--text-tertiary)]">La página pública se actualiza al guardar.</p>
      </div>
    </form>
  );

  function patchParagraph(id: string, update: Partial<AboutStoryParagraph>) {
    setContent((current) => ({ ...current, story: { ...current.story, paragraphs: current.story.paragraphs.map((p) => p.id === id ? { ...p, ...update } : p) } }));
  }
  function moveParagraph(index: number, direction: -1 | 1) {
    setContent((current) => ({ ...current, story: { ...current.story, paragraphs: moveIn(current.story.paragraphs, index, direction) } }));
  }
  function removeParagraph(id: string) {
    setContent((current) => ({ ...current, story: { ...current.story, paragraphs: current.story.paragraphs.filter((p) => p.id !== id) } }));
  }

  function patchMilestone(id: string, update: Partial<AboutMilestone>) {
    setContent((current) => ({ ...current, milestones: { ...current.milestones, items: current.milestones.items.map((m) => m.id === id ? { ...m, ...update } : m) } }));
  }
  function moveMilestone(index: number, direction: -1 | 1) {
    setContent((current) => ({ ...current, milestones: { ...current.milestones, items: moveIn(current.milestones.items, index, direction) } }));
  }
  function removeMilestone(id: string) {
    setContent((current) => ({ ...current, milestones: { ...current.milestones, items: current.milestones.items.filter((m) => m.id !== id) } }));
  }

  function patchValue(id: string, update: Partial<AboutValue>) {
    setContent((current) => ({ ...current, values: { ...current.values, items: current.values.items.map((v) => v.id === id ? { ...v, ...update } : v) } }));
  }
  function moveValue(index: number, direction: -1 | 1) {
    setContent((current) => ({ ...current, values: { ...current.values, items: moveIn(current.values.items, index, direction) } }));
  }
  function removeValue(id: string) {
    setContent((current) => ({ ...current, values: { ...current.values, items: current.values.items.filter((v) => v.id !== id) } }));
  }
  function addValue() {
    if (content.values.items.length >= 12) return;
    setContent((current) => ({ ...current, values: { ...current.values, items: [...current.values.items, { id: newId(), title: "Nuevo valor", description: "Describe este principio.", visible: true }] } }));
  }

  function patchStat(id: string, update: Partial<AboutStat>) {
    setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.map((s) => s.id === id ? { ...s, ...update } : s) } }));
  }
  function moveStat(index: number, direction: -1 | 1) {
    setContent((current) => ({ ...current, stats: { ...current.stats, items: moveIn(current.stats.items, index, direction) } }));
  }
  function removeStat(id: string) {
    setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.filter((s) => s.id !== id) } }));
  }
  function addStat() {
    if (content.stats.items.length >= 8) return;
    setContent((current) => ({ ...current, stats: { ...current.stats, items: [...current.stats.items, { id: newId(), value: "100%", label: "nueva cifra", visible: true }] } }));
  }
}

function moveIn<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function CtaEditor({ value, onChange }: { value: AboutCTA; onChange: (value: AboutCTA) => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Sección final</span>
        <label className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          <input type="checkbox" checked={value.visible} onChange={(event) => onChange({ ...value, visible: event.target.checked })} /> Visible
        </label>
      </div>
      <label className="mt-3 block text-[13px] font-semibold">Título<input value={value.title} maxLength={120} onChange={(event) => onChange({ ...value, title: event.target.value })} className={inputClass} /></label>
      <label className="mt-3 block text-[13px] font-semibold">Texto<textarea rows={2} value={value.body} maxLength={500} onChange={(event) => onChange({ ...value, body: event.target.value })} className={inputClass} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-semibold">Texto del botón<input value={value.buttonText} maxLength={80} onChange={(event) => onChange({ ...value, buttonText: event.target.value })} className={inputClass} /></label>
        <label className="block text-[13px] font-semibold">Ruta interna (ej. /catalogo)<input value={value.buttonHref} maxLength={120} onChange={(event) => onChange({ ...value, buttonHref: event.target.value })} className={inputClass} /></label>
      </div>
    </div>
  );
}
