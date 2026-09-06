"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/lib/actions/site-settings";
import type { HeroContent, HeroTextBlock, SiteSettings } from "@/lib/site-settings";

const inputClass = "mt-2 block w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-3 py-2.5 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

function TextBlockEditor({
  label,
  id,
  element,
  value,
  onChange,
}: {
  label: string;
  id: string;
  element: "p" | "h1";
  value: HeroTextBlock;
  onChange: (value: HeroTextBlock) => void;
}) {
  const isLong = element === "p" && (id === "description" || value.text.length > 90);
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={`hero-${id}`} className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</label>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Elemento semántico <code className="rounded bg-black/5 px-1 py-0.5">&lt;{element}&gt;</code> · {element === "h1" ? "título principal, uno por página" : "párrafo de apoyo"}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          <input type="checkbox" checked={value.visible} onChange={(event) => onChange({ ...value, visible: event.target.checked })} /> Visible
        </label>
      </div>
      {isLong ? <textarea id={`hero-${id}`} value={value.text} maxLength={500} rows={4} onChange={(event) => onChange({ ...value, text: event.target.value })} className={inputClass} /> : <input id={`hero-${id}`} value={value.text} maxLength={500} onChange={(event) => onChange({ ...value, text: event.target.value })} className={inputClass} />}
      <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{value.text.length}/500</p>
    </div>
  );
}

function ButtonEditor({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: HeroContent["primaryButton"];
  onChange: (value: HeroContent["primaryButton"]) => void;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={`hero-${id}-text`} className="text-[14px] font-semibold">{label}</label>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Elemento semántico <code className="rounded bg-black/5 px-1 py-0.5">&lt;a&gt;</code> · texto visible y destino interno</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--text-secondary)]"><input type="checkbox" checked={value.visible} onChange={(event) => onChange({ ...value, visible: event.target.checked })} /> Visible</label>
      </div>
      <input id={`hero-${id}-text`} value={value.text} maxLength={80} onChange={(event) => onChange({ ...value, text: event.target.value })} className={inputClass} placeholder="Texto del botón" />
      <input aria-label={`Ruta de ${label}`} value={value.href} maxLength={120} onChange={(event) => onChange({ ...value, href: event.target.value })} className={inputClass} placeholder="/ruta-interna" />
    </div>
  );
}

export default function ConfiguracionClient({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [taxRate, setTaxRate] = useState(String(settings.taxRate));
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [hero, setHero] = useState<HeroContent>(settings.hero);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    setError("");
    setSaving(true);
    try {
      await updateSiteSettings({ taxRate: Number(taxRate), whatsappNumber, hero });
      setStatus("Configuración y hero guardados.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl p-8">
      <div className="mb-8"><p className="catalog-kicker">Operación de tienda</p><h1 className="text-[28px] font-bold">Configuración</h1><p className="mt-1 text-[var(--text-secondary)]">Controla valores generales y contenido visible del escaparate.</p></div>
      <form onSubmit={save} className="space-y-6">
        <section className="card-apple space-y-6 p-6 hover:!transform-none">
          <div><p className="catalog-kicker">Contenido de portada</p><h2 className="mt-1 text-[21px] font-bold">Hero editable</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">Cada control conserva su tipo de contenido. Edita texto, visibilidad y rutas sin tocar código. El H1 sigue siendo único y los párrafos se mantienen como elementos P.</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TextBlockEditor id="eyebrow" label="Eyebrow" element="p" value={hero.eyebrow} onChange={(value) => setHero({ ...hero, eyebrow: value })} />
            <TextBlockEditor id="headline" label="Título principal" element="h1" value={hero.headline} onChange={(value) => setHero({ ...hero, headline: value })} />
            <div className="lg:col-span-2"><TextBlockEditor id="description" label="Descripción" element="p" value={hero.description} onChange={(value) => setHero({ ...hero, description: value })} /></div>
            <ButtonEditor id="primary-button" label="Botón primario" value={hero.primaryButton} onChange={(value) => setHero({ ...hero, primaryButton: value })} />
            <ButtonEditor id="secondary-button" label="Botón secundario" value={hero.secondaryButton} onChange={(value) => setHero({ ...hero, secondaryButton: value })} />
          </div>
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-black p-6" aria-hidden="true">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Vista previa del hero</p>
            <div className="mx-auto max-w-2xl text-center">
              {hero.eyebrow.visible && <p className="mb-3 text-[13px] font-medium tracking-wide text-[var(--accent)]">{hero.eyebrow.text || "Texto superior"}</p>}
              {hero.headline.visible && <h1 className="text-fit-grow text-[clamp(2rem,7vw,5rem)] font-bold leading-[1.05] tracking-[-0.025em] text-white">{hero.headline.text || "Tu próximo smartphone, aquí."}</h1>}
              {hero.description.visible && <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-[15px] leading-6 text-[#A1A1A6]">{hero.description.text || "Descripción de portada"}</p>}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {hero.primaryButton.visible && <span className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[13px] font-medium text-white">{hero.primaryButton.text || "Botón principal"}</span>}
                {hero.secondaryButton.visible && <span className="rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-medium text-white">{hero.secondaryButton.text || "Botón secundario"}</span>}
              </div>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-4 text-[12px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Reglas editoriales:</strong> H1 máximo 500 caracteres. Párrafos máximo 500. Botones máximo 80. Hero H1 puede ampliar tipografía hasta 15% cuando el navegador lo admite. Rutas deben ser internas, por ejemplo <code>/catalogo</code>.</div>
        </section>

        <section className="card-apple space-y-6 p-6 hover:!transform-none"><div><p className="catalog-kicker">Operación</p><h2 className="mt-1 text-[21px] font-bold">Valores generales</h2></div><div className="grid gap-5 md:grid-cols-2"><div><label htmlFor="tax-rate" className="text-[14px] font-semibold">IVA aplicado a productos (%)</label><input id="tax-rate" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className={inputClass} required /><p className="mt-2 text-[12px] text-[var(--text-tertiary)]">Usado para carrito, Dataweb y nuevas órdenes.</p></div><div><label htmlFor="whatsapp-number" className="text-[14px] font-semibold">WhatsApp para consultas</label><input id="whatsapp-number" type="tel" inputMode="numeric" value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} className={inputClass} required /><p className="mt-2 text-[12px] text-[var(--text-tertiary)]">Código de país, sin espacios ni símbolo +.</p></div></div></section>

        {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-[13px] text-[var(--status-red)]">{error}</p>}{status && <p role="status" className="rounded-[var(--radius-sm)] bg-green-50 px-3 py-2 text-[13px] text-green-700">{status}</p>}
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Guardando..." : "Guardar configuración"}</button>
      </form>
    </div>
  );
}
