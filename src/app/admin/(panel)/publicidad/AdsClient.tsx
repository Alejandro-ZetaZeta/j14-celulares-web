"use client";

/**
 * AdsClient — Admin CRUD interface for the Publicidad (Ads) section.
 *
 * Features:
 * - Table listing all ads (including hidden) with thumbnail previews
 * - Inline form for creating / editing an ad
 * - Separate upload zones for desktop and mobile images
 * - Toggle visibility (hide/show) without deleting
 * - Delete with confirmation
 * - Click-through URL field (any absolute URL or relative path)
 */

import { useRef, useState, useTransition } from "react";
import type { Ad } from "@/types/database";
import {
  createAd,
  deleteAd,
  toggleAdVisibility,
  updateAd,
} from "@/lib/actions/admin-ads";
import ImageUploadZone from "@/components/admin/ImageUploadZone";

// ── Blank form state ──────────────────────────────────────────

const blank = {
  title: "",
  link_url: "",
  display_order: 0,
};

// ── Helper ────────────────────────────────────────────────────

function fileToFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

// ── Component ─────────────────────────────────────────────────

export default function AdsClient({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [desktopFiles, setDesktopFiles] = useState<File[]>([]);
  const [mobileFiles, setMobileFiles] = useState<File[]>([]);
  const [removeMobile, setRemoveMobile] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function field<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(blank);
    setEditing(null);
    setDesktopFiles([]);
    setMobileFiles([]);
    setRemoveMobile(false);
    setError("");
  }

  function startEdit(ad: Ad) {
    setEditing(ad.id);
    setForm({
      title: ad.title,
      link_url: ad.link_url ?? "",
      display_order: ad.display_order,
    });
    setDesktopFiles([]);
    setMobileFiles([]);
    setRemoveMobile(false);
    setError("");
  }

  // ── Save (create or update) ─────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!editing && desktopFiles.length === 0) {
      setError("La imagen de escritorio es requerida.");
      return;
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updateAd(editing, {
            title: form.title,
            link_url: form.link_url,
            display_order: Number(form.display_order),
            desktopImageFormData: desktopFiles[0] ? fileToFormData(desktopFiles[0]) : null,
            mobileImageFormData: mobileFiles[0] ? fileToFormData(mobileFiles[0]) : null,
            removeMobileImage: removeMobile,
          });
          setAds((prev) =>
            prev.map((a) =>
              a.id === editing
                ? {
                    ...a,
                    title: form.title,
                    link_url: form.link_url || null,
                    display_order: Number(form.display_order),
                  }
                : a
            )
          );
        } else {
          const created = await createAd({
            title: form.title,
            link_url: form.link_url,
            display_order: Number(form.display_order),
            desktopImageFormData: fileToFormData(desktopFiles[0]),
            mobileImageFormData: mobileFiles[0] ? fileToFormData(mobileFiles[0]) : null,
          });
          setAds((prev) => [created, ...prev]);
        }
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el anuncio.");
      }
    });
  }

  // ── Toggle visibility ─────────────────────────────────────

  function handleToggle(id: string) {
    startTransition(async () => {
      try {
        const newHidden = await toggleAdVisibility(id);
        setAds((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_hidden: newHidden } : a))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cambiar visibilidad.");
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este anuncio permanentemente?")) return;
    startTransition(async () => {
      try {
        await deleteAd(id);
        setAds((prev) => prev.filter((a) => a.id !== id));
        if (editing === id) reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar el anuncio.");
      }
    });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="catalog-kicker">Marketing y comunicación</p>
        <h1 className="text-[28px] font-bold">Publicidad</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Anuncios de pantalla completa que aparecen al visitar el sitio. Cada anuncio admite
          versión escritorio (horizontal) y versión móvil (vertical).
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* ── Table ── */}
        <section className="card-apple overflow-hidden hover:!transform-none">
          {ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-[var(--text-tertiary)]">
              <svg width="32" height="32" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.5 1.5c0 0-4.5 2-8 2H2c-.55228 0-1 .44772-1 1v3c0 .55228.44772 1 1 1h.5l1 4h2l-.5-4c3.5 0 7.5 2 7.5 2V1.5Z" />
                <path d="M13.5 4.5v5" />
              </svg>
              <p className="text-[15px] font-medium text-[var(--text-primary)]">Sin anuncios</p>
              <p className="text-[13px]">Crea tu primer anuncio con el formulario.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                    <th className="px-5 py-3 text-left font-medium text-[var(--text-tertiary)]">Anuncio</th>
                    <th className="px-5 py-3 text-left font-medium text-[var(--text-tertiary)]">Enlace</th>
                    <th className="px-5 py-3 text-center font-medium text-[var(--text-tertiary)]">Orden</th>
                    <th className="px-5 py-3 text-center font-medium text-[var(--text-tertiary)]">Estado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr
                      key={ad.id}
                      className={[
                        "border-b border-[var(--border)] last:border-0 transition-colors",
                        editing === ad.id ? "bg-[var(--accent-light)]" : "hover:bg-[var(--bg-secondary)]/60",
                      ].join(" ")}
                    >
                      {/* Thumbnail + title */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Desktop thumbnail */}
                          <div className="relative flex-shrink-0 w-20 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                            {ad.image_mobile_url && (
                              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white leading-none py-0.5">
                                +M
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{ad.title}</p>
                            <p className="text-[11px] text-[var(--text-tertiary)] font-mono truncate max-w-[180px]">
                              {ad.id.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Link */}
                      <td className="px-5 py-3">
                        {ad.link_url ? (
                          <span className="text-[12px] text-[var(--accent)] font-mono truncate max-w-[140px] block">
                            {ad.link_url}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      {/* Order */}
                      <td className="px-5 py-3 text-center text-[var(--text-secondary)]">
                        {ad.display_order}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3 text-center">
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            ad.is_hidden
                              ? "bg-[var(--border)] text-[var(--text-tertiary)]"
                              : "bg-[var(--status-green)]/12 text-[var(--status-green)]",
                          ].join(" ")}
                        >
                          <span className={["h-1.5 w-1.5 rounded-full", ad.is_hidden ? "bg-[var(--text-tertiary)]" : "bg-[var(--status-green)]"].join(" ")} />
                          {ad.is_hidden ? "Oculto" : "Visible"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-3 text-right space-x-3">
                        <button
                          onClick={() => startEdit(ad)}
                          className="text-[var(--accent)] hover:underline text-[13px]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggle(ad.id)}
                          disabled={isPending}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline text-[13px] disabled:opacity-50"
                        >
                          {ad.is_hidden ? "Mostrar" : "Ocultar"}
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={isPending}
                          className="text-[var(--status-red)] hover:underline text-[13px] disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Form ── */}
        <form
          onSubmit={(e) => void handleSave(e)}
          className="card-apple flex flex-col gap-5 p-6 hover:!transform-none self-start"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-[16px]">
              {editing ? "Editar anuncio" : "Nuevo anuncio"}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="text-[12px] text-[var(--text-secondary)] hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--status-red)]/8 px-3 py-2 text-[13px] text-[var(--status-red)] border border-[var(--status-red)]/20">
              {error}
            </p>
          )}

          {/* Title */}
          <label className="text-[13px] font-medium text-[var(--text-primary)]">
            Título del anuncio
            <input
              required
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              placeholder="Ej: Promoción de verano"
              className="input-apple mt-1"
            />
          </label>

          {/* Link URL */}
          <label className="text-[13px] font-medium text-[var(--text-primary)]">
            URL de destino al hacer clic
            <input
              value={form.link_url}
              onChange={(e) => field("link_url", e.target.value)}
              placeholder="Ej: /catalogo o https://..."
              className="input-apple mt-1"
            />
            <span className="mt-1 block text-[11px] text-[var(--text-tertiary)]">
              Acepta rutas relativas (<code>/catalogo</code>, <code>/checkout</code>) o URLs absolutas (<code>https://...</code>). Dejar vacío para anuncio sin enlace.
            </span>
          </label>

          {/* Order */}
          <label className="text-[13px] font-medium text-[var(--text-primary)]">
            Orden en el carrusel
            <input
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => field("display_order", Number(e.target.value) as unknown as number)}
              className="input-apple mt-1"
            />
            <span className="mt-1 block text-[11px] text-[var(--text-tertiary)]">
              Menor número aparece primero. El 0 es el primer slide.
            </span>
          </label>

          {/* Desktop image */}
          <div>
            <p className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">
              Imagen escritorio{!editing && <span className="text-[var(--status-red)]"> *</span>}
              <span className="ml-1.5 text-[11px] font-normal text-[var(--text-tertiary)]">— horizontal, 16:9 recomendado</span>
            </p>
            {editing && (
              <p className="text-[11px] text-[var(--text-tertiary)] mb-2">
                Deja vacío para conservar la imagen actual.
              </p>
            )}
            <ImageUploadZone
              files={desktopFiles}
              onChange={setDesktopFiles}
            />
          </div>

          {/* Mobile image */}
          <div>
            <p className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">
              Imagen móvil
              <span className="ml-1.5 text-[11px] font-normal text-[var(--text-tertiary)]">— vertical, 9:16 recomendado</span>
            </p>
            {editing && (
              <p className="text-[11px] text-[var(--text-tertiary)] mb-2">
                Deja vacío para conservar. Marca la casilla para eliminarla.
              </p>
            )}
            <ImageUploadZone
              files={mobileFiles}
              onChange={setMobileFiles}
            />
            {editing && (
              <label className="mt-2 flex items-center gap-2 text-[12px] text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeMobile}
                  onChange={(e) => setRemoveMobile(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Eliminar imagen móvil existente
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary disabled:opacity-50 mt-1"
          >
            {isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear anuncio"}
          </button>
        </form>
      </div>
    </div>
  );
}
