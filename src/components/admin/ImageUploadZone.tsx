"use client";

/**
 * ImageUploadZone
 * ─────────────────────────────────────────────────────────
 * A drag-and-drop multi-photo upload area for the admin
 * product forms (Nuevo & Editar).
 *
 * Props:
 *   files          – controlled list of pending File objects
 *   onChange       – called whenever the list changes
 *   existingImages – already-saved images (edit mode only)
 *   onReorderExisting – called when saved-image order changes
 *   onRemoveExisting  – called when a saved image is removed
 *   disabled       – disable all interaction
 */

import { useRef, useState, useCallback, useMemo } from "react";

export interface ExistingImage {
  id: string;
  url: string;
}

interface ImageUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingImages?: ExistingImage[];
  onReorderExisting?: (ids: string[]) => void;
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
}

interface PendingItem {
  kind: "pending";
  file: File;
  preview: string;
}

interface SavedItem {
  kind: "saved";
  id: string;
  url: string;
}

type GridItem = PendingItem | SavedItem;

// File object identity survives reorder. Cache prevents blob URL replacement
// or revocation when controlled `files` array changes order.
const previewUrlCache = new WeakMap<File, string>();

export default function ImageUploadZone({
  files,
  onChange,
  existingImages = [],
  onReorderExisting,
  onRemoveExisting,
  disabled = false,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Drag-to-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Build stable blob preview URLs from file identity.
  const previews = useMemo(() => {
    const next = files.map((f) => {
      const existing = previewUrlCache.get(f);
      if (existing) return existing;
      const url = URL.createObjectURL(f);
      previewUrlCache.set(f, url);
      return url;
    });
    return next;
  }, [files]);

  const grid: GridItem[] = [
    ...existingImages.map((img): SavedItem => ({ kind: "saved", id: img.id, url: img.url })),
    ...files.map((f, i): PendingItem => ({ kind: "pending", file: f, preview: previews[i] ?? "" })),
  ];

  // ── File picker ──────────────────────────────────────────
  function openPicker() {
    if (disabled) return;
    // Reset value so the same file can be re-selected and
    // so a cancel doesn't fire change with an empty list.
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = [...(e.target.files ?? [])];
    // Bug fix: if the user cancelled the dialog, files is empty — preserve current selection.
    if (incoming.length === 0) return;
    onChange([...files, ...incoming]);
    // Reset so the next click always triggers change
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Drop zone ────────────────────────────────────────────
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    if (disabled) return;
    const dropped = [...e.dataTransfer.files].filter((f) =>
      f.type.startsWith("image/")
    );
    if (dropped.length) onChange([...files, ...dropped]);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDraggingOver(true);
  }

  // ── Remove ───────────────────────────────────────────────
  function removePending(fileIndex: number) {
    const next = files.filter((_, i) => i !== fileIndex);
    onChange(next);
  }

  // ── Drag-to-reorder (grid items) ─────────────────────────
  const handleItemDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleItemDragEnter = useCallback((index: number) => {
    setOverIndex(index);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    // Rebuild grid after reorder
    const reordered = [...grid];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);

    const newSaved = reordered.filter((it): it is SavedItem => it.kind === "saved");
    const newPending = reordered.filter((it): it is PendingItem => it.kind === "pending");

    // Notify parent of new order for each kind
    if (onReorderExisting) {
      onReorderExisting(newSaved.map((s) => s.id));
    }
    onChange(newPending.map((p) => p.file));

    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, grid, onChange, onReorderExisting]);

  const hasImages = grid.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone (always visible) */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Zona de carga de fotos. Arrastra imágenes aquí o presiona Enter para seleccionar archivos."
        onClick={openPicker}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPicker(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDraggingOver(false)}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-8 text-center transition-all duration-200 cursor-pointer select-none",
          isDraggingOver
            ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]"
            : "border-[var(--border-strong)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/3",
          disabled ? "pointer-events-none opacity-50" : "",
        ].join(" ")}
      >
        {/* Upload icon */}
        <div className={[
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200",
          isDraggingOver ? "bg-[var(--accent)]/15" : "bg-[var(--border)]/40",
        ].join(" ")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDraggingOver ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div>
          <p className={[
            "text-[14px] font-semibold transition-colors duration-200",
            isDraggingOver ? "text-[var(--accent)]" : "text-[var(--text-primary)]",
          ].join(" ")}>
            {isDraggingOver ? "Suelta las fotos aquí" : "Arrastra fotos aquí"}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            o <span className="text-[var(--accent)] font-medium underline-offset-2 hover:underline">haz clic para seleccionar</span>
          </p>
          <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
            JPG, PNG · Puedes agregar varias fotos y reordenarlas
          </p>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Thumbnail grid */}
      {hasImages && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {grid.length} {grid.length === 1 ? "foto" : "fotos"} · arrastra para reordenar
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {grid.map((item, index) => {
              const isDragging = dragIndex === index;
              const isOver = overIndex === index && dragIndex !== index;
              const src = item.kind === "saved" ? item.url : item.preview;

              return (
                <div
                  key={item.kind === "saved" ? item.id : `pending-${index}`}
                  draggable
                  onDragStart={() => handleItemDragStart(index)}
                  onDragEnter={() => handleItemDragEnter(index)}
                  onDragEnd={handleItemDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={[
                    "group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border-2 bg-[var(--bg-secondary)] transition-all duration-150 cursor-grab active:cursor-grabbing",
                    isDragging ? "opacity-40 scale-95 border-[var(--accent)]" : "border-transparent",
                    isOver ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-105" : "",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {src && <img
                    src={src}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-contain p-1.5 pointer-events-none"
                    draggable={false}
                  />}

                  {/* Position badge */}
                  <span className="absolute bottom-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-[9px] font-bold text-white">
                    {index + 1}
                  </span>

                  {/* Remove button */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.kind === "pending") {
                          const pendingIndex = index - existingImages.length;
                          removePending(pendingIndex);
                        } else {
                          onRemoveExisting?.(item.id);
                        }
                      }}
                      aria-label={`Eliminar foto ${index + 1}`}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-red-500"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <line x1="1" y1="1" x2="9" y2="9" />
                        <line x1="9" y1="1" x2="1" y2="9" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

            {/* "Add more" mini-tile */}
            {!disabled && (
              <button
                type="button"
                onClick={openPicker}
                aria-label="Agregar más fotos"
                className="aspect-square rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/60 hover:text-[var(--accent)] flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
