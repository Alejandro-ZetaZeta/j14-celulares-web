"use client";

import { useEffect, useState } from "react";
import type { CatalogCollection, CollectionMatchType } from "@/types/database";
import { createCollection, deleteCollection, updateCollection } from "@/lib/actions/admin-collections";

const empty = { label: "", slug: "", description: "", match_type: "model_contains" as CollectionMatchType, match_value: "", show_as_chip: true, show_on_home: false, pin_order: 100, is_active: true };

const matchTypeLabels: Record<CollectionMatchType, string> = {
  all: "Todos los productos",
  product_type: "Tipo de producto",
  brand_eq: "Marca exacta",
  model_contains: "Modelo contiene",
};

function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="collections-help-title">
      <button type="button" aria-label="Cerrar tutorial" onClick={onClose} className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      <section className="relative flex max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)]">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-light),var(--surface)_58%)] px-6 py-5 sm:px-8">
          <div>
            <p className="catalog-kicker">Guía rápida</p>
            <h2 id="collections-help-title" className="mt-1 text-[24px] font-bold tracking-[-0.02em]">Cómo funcionan las colecciones</h2>
            <p className="mt-2 max-w-lg text-[14px] leading-6 text-[var(--text-secondary)]">Una colección es una sección automática del catálogo. Define una regla y el sitio reúne allí los productos que coinciden.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar tutorial" className="rounded-full px-2 text-2xl leading-none text-[var(--text-secondary)] transition hover:bg-white/70 hover:text-[var(--text-primary)]">×</button>
        </header>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">1. Define</p><p className="mt-2 text-[13px] text-[var(--text-secondary)]">Nombre y regla de coincidencia.</p></div>
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">2. Ordena</p><p className="mt-2 text-[13px] text-[var(--text-secondary)]">Decide su posición con Orden.</p></div>
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">3. Publica</p><p className="mt-2 text-[13px] text-[var(--text-secondary)]">Activa dónde quieres mostrarla.</p></div>
          </div>

          <section className="mt-7">
            <h3 className="text-[16px] font-bold">Qué significa cada campo</h3>
            <div className="mt-3 divide-y divide-[var(--border)]">
              <div className="py-3"><p className="font-semibold">Nombre</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Título visible para clientes, por ejemplo “iPhone” o “Android”.</p></div>
              <div className="py-3"><p className="font-semibold">Slug</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Parte de la URL. Si lo dejas vacío, se genera desde el nombre. Cambiarlo puede cambiar el enlace público de la colección.</p></div>
              <div className="py-3"><p className="font-semibold">Regla y valor</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]"><strong>Todos</strong> incluye cualquier producto. <strong>Tipo</strong> filtra valores como Android o iPhone. <strong>Marca exacta</strong> busca una marca. <strong>Modelo contiene</strong> encuentra ese texto dentro del modelo. El valor debe coincidir con cómo está escrito en Productos.</p></div>
              <div className="py-3"><p className="font-semibold">Descripción</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Texto de apoyo para explicar la colección en el catálogo, si la interfaz lo muestra.</p></div>
              <div className="py-3"><p className="font-semibold">Mostrar como chip</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Muestra u oculta el acceso corto de esta colección junto a los filtros del catálogo.</p></div>
              <div className="py-3"><p className="font-semibold">Mostrar en inicio</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Añade u oculta esta colección en la página principal. No cambia qué productos coinciden.</p></div>
              <div className="py-3"><p className="font-semibold">Activa</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Una colección inactiva deja de estar disponible públicamente, aunque sus datos se conservan para editarla después.</p></div>
            </div>
          </section>

          <section className="mt-7 rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent-light)] p-5">
            <h3 className="font-bold">Cómo funciona “Orden”</h3>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">El número controla la posición de las colecciones: <strong>números menores aparecen primero</strong>. Por ejemplo, Orden 10 aparece antes que Orden 20. Usa saltos (10, 20, 30) para poder insertar nuevas colecciones después. Orden no afecta precios, productos ni resultados; solo cambia la prioridad visual.</p>
          </section>

          <section className="mt-7">
            <h3 className="text-[16px] font-bold">Crear o editar sin riesgo</h3>
            <ol className="mt-3 space-y-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              <li><span className="font-semibold text-[var(--text-primary)]">1.</span> Para crear, completa el formulario de la derecha y pulsa “Crear colección”.</li>
              <li><span className="font-semibold text-[var(--text-primary)]">2.</span> Para modificar, pulsa “Editar” en una fila; el formulario cargará sus valores.</li>
              <li><span className="font-semibold text-[var(--text-primary)]">3.</span> Revisa regla, valor, Orden y visibilidad antes de guardar.</li>
              <li><span className="font-semibold text-[var(--text-primary)]">4.</span> “Eliminar” borra la colección. No borra productos, pero sí su sección y sus accesos.</li>
            </ol>
          </section>
        </div>
        <footer className="border-t border-[var(--border)] px-6 py-4 text-right sm:px-8"><button type="button" onClick={onClose} className="btn-primary !px-5 !py-2.5 !text-[13px]">Entendido</button></footer>
      </section>
    </div>
  );
}

export default function CollectionsClient({ initialCollections }: { initialCollections: CatalogCollection[] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  function field(name: keyof typeof form, value: string | boolean | number) { setForm((current) => ({ ...current, [name]: value })); }
  function startEdit(collection: CatalogCollection) { setEditing(collection.id); setForm({ label: collection.label, slug: collection.slug, description: collection.description ?? "", match_type: collection.match_type, match_value: collection.match_value ?? "", show_as_chip: collection.show_as_chip, show_on_home: collection.show_on_home, pin_order: collection.pin_order, is_active: collection.is_active }); }
  function reset() { setEditing(null); setForm(empty); setError(""); }
  async function save(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { const input = { ...form, slug: form.slug || form.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }; if (editing) { await updateCollection(editing, input); setCollections((items) => items.map((item) => item.id === editing ? { ...item, ...input } : item)); } else { const created = await createCollection(input); setCollections((items) => [...items, created].sort((a, b) => a.pin_order - b.pin_order)); } reset(); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar."); } finally { setSaving(false); } }
  async function remove(id: string) { if (!window.confirm("¿Eliminar esta colección?")) return; await deleteCollection(id); setCollections((items) => items.filter((item) => item.id !== id)); if (editing === id) reset(); }

  return <div className="p-8">
    <div className="mb-8 flex items-start justify-between gap-4"><div><p className="catalog-kicker">Control del escaparate</p><h1 className="text-[28px] font-bold text-[var(--text-primary)]">Colecciones</h1><p className="mt-1 text-[var(--text-secondary)]">Administra filtros y accesos sin tocar código.</p></div><button type="button" onClick={() => setHelpOpen(true)} aria-label="Abrir tutorial de colecciones" title="¿Cómo funcionan las colecciones?" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[16px] font-bold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]">?</button></div>
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card-apple overflow-hidden hover:!transform-none"><div className="overflow-x-auto"><table className="w-full text-[14px]"><thead><tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]"><th className="px-5 py-3 text-left">Colección</th><th className="px-5 py-3 text-left">Regla</th><th className="px-5 py-3 text-center">Visible</th><th className="px-5 py-3" /></tr></thead><tbody>{collections.map((collection) => <tr key={collection.id} className="border-b border-[var(--border)] last:border-0"><td className="px-5 py-4"><p className="font-semibold">{collection.label}</p><p className="text-[12px] text-[var(--text-tertiary)]">/{collection.slug}</p></td><td className="px-5 py-4 text-[12px] text-[var(--text-secondary)]">{matchTypeLabels[collection.match_type]}: {collection.match_value || "todos"}</td><td className="px-5 py-4 text-center">{collection.is_active ? "Sí" : "No"}</td><td className="whitespace-nowrap px-5 py-4 text-right"><button onClick={() => startEdit(collection)} className="mr-3 text-[var(--accent)] hover:underline">Editar</button><button onClick={() => remove(collection.id)} className="text-[var(--status-red)] hover:underline">Eliminar</button></td></tr>)}</tbody></table></div></section>
      <form onSubmit={save} className="card-apple flex flex-col gap-4 p-6 hover:!transform-none"><div className="flex items-start justify-between"><div><h2 className="font-semibold">{editing ? "Editar colección" : "Nueva colección"}</h2><p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Las reglas se evalúan sobre marca y modelo.</p></div>{editing && <button type="button" onClick={reset} className="text-[12px] text-[var(--text-secondary)] hover:underline">Cancelar</button>}</div><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Nombre</span><input required value={form.label} onChange={(e) => field("label", e.target.value)} className="input-apple" /></label><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Slug</span><input value={form.slug} onChange={(e) => field("slug", e.target.value)} placeholder="Se genera automáticamente" className="input-apple" /></label><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Descripción</span><textarea value={form.description} onChange={(e) => field("description", e.target.value)} className="input-apple min-h-20" /></label><div className="grid grid-cols-2 gap-3"><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Regla</span><select value={form.match_type} onChange={(e) => field("match_type", e.target.value as CollectionMatchType)} className="input-apple">{Object.entries(matchTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Valor</span><input value={form.match_value} onChange={(e) => field("match_value", e.target.value)} placeholder={form.match_type === "all" ? "No aplica" : "Ej. Apple"} disabled={form.match_type === "all"} className="input-apple" /></label></div><label className="flex flex-col gap-1 text-[13px]"><span className="font-medium">Orden</span><input type="number" value={form.pin_order} onChange={(e) => field("pin_order", Number(e.target.value))} className="input-apple" /><span className="text-[11px] text-[var(--text-tertiary)]">Menor número = aparece primero.</span></label><label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.show_as_chip} onChange={(e) => field("show_as_chip", e.target.checked)} /> Mostrar como chip</label><label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.show_on_home} onChange={(e) => field("show_on_home", e.target.checked)} /> Mostrar en inicio</label><label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.is_active} onChange={(e) => field("is_active", e.target.checked)} /> Activa</label>{error && <p className="text-[13px] text-[var(--status-red)]">{error}</p>}<button disabled={saving} className="btn-primary mt-2 disabled:opacity-50">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear colección"}</button></form>
    </div>
    {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
  </div>;
}
