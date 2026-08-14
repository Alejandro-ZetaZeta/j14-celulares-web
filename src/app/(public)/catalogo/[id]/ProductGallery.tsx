"use client";

/**
 * ProductGallery
 * ─────────────────────────────────────────────────────────
 * E-commerce-style product image gallery.
 *
 * Desktop (≥ lg):  vertical thumbnail strip on the left  |  large main image on the right
 * Mobile   (< lg):  large main image on top             |  horizontal thumbnail strip below
 *
 * Features:
 *  - Animated cross-fade between selections
 *  - Thumbnail strip always visible when ≥ 2 images
 *  - Keyboard-navigable thumbnails (ArrowUp/Down on desktop, ArrowLeft/Right on mobile)
 *  - Graceful fallback when no images are available
 */

import Image from "next/image";
import { useState, useCallback } from "react";
import type { ProductImage } from "@/types/database";

interface ProductGalleryProps {
  images: ProductImage[];
  fallbackUrl: string | null;
  alt: string;
}

export default function ProductGallery({ images, fallbackUrl, alt }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const all: { id: string; image_url: string }[] = sorted.length
    ? sorted
    : fallbackUrl
    ? [{ id: "legacy", image_url: fallbackUrl }]
    : [];

  const [selected, setSelected] = useState(0);
  const [fading, setFading] = useState(false);

  const selectImage = useCallback(
    (index: number) => {
      if (index === selected) return;
      setFading(true);
      setTimeout(() => {
        setSelected(index);
        setFading(false);
      }, 120);
    },
    [selected]
  );

  const current = all[selected];
  const hasMultiple = all.length > 1;

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[var(--radius-xl)] bg-[var(--bg-secondary)] text-[13px] text-[var(--text-tertiary)]">
        Imagen no disponible
      </div>
    );
  }

  return (
    /*
     * Desktop: grid with thumbnail column (left) + main image (right)
     * Mobile:  flex-col with main image (top) + thumbnail row (bottom)
     */
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      {/* ── Thumbnail strip ─────────────────────────────────── */}
      {hasMultiple && (
        <div
          className="
            flex flex-row gap-2 overflow-x-auto pb-1
            lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:max-h-[520px]
            scrollbar-hide
          "
          aria-label="Miniaturas del producto"
          role="listbox"
        >
          {all.map((image, index) => {
            const isActive = selected === index;
            return (
              <button
                key={image.id}
                type="button"
                role="option"
                aria-selected={isActive}
                aria-label={`Ver foto ${index + 1} de ${all.length}`}
                onClick={() => selectImage(index)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    selectImage(Math.min(index + 1, all.length - 1));
                  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    selectImage(Math.max(index - 1, 0));
                  }
                }}
                className={[
                  "relative shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 bg-[var(--bg-secondary)] transition-all duration-200",
                  "h-[72px] w-[72px]",
                  isActive
                    ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-light)]"
                    : "border-transparent hover:border-[var(--border-strong)]",
                ].join(" ")}
              >
                <Image
                  src={image.image_url}
                  alt={`${alt} — miniatura ${index + 1}`}
                  fill
                  sizes="72px"
                  className="object-contain p-1.5"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main image ──────────────────────────────────────── */}
      <div className="flex-1">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-secondary)]">
          <div
            className="absolute inset-0 transition-opacity duration-[120ms] ease-in-out"
            style={{ opacity: fading ? 0 : 1 }}
          >
            <Image
              src={current.image_url}
              alt={`${alt} — imagen ${selected + 1}`}
              fill
              sizes="(max-width: 1023px) calc(100vw - 2.5rem), 430px"
              className="object-contain p-8 lg:p-10"
              priority={selected === 0}
            />
          </div>
        </div>

        {/* Dot indicators on mobile when multiple images */}
        {hasMultiple && (
          <div
            className="mt-3 flex justify-center gap-1.5 lg:hidden"
            aria-hidden="true"
          >
            {all.map((_, index) => (
              <button
                key={index}
                type="button"
                tabIndex={-1}
                onClick={() => selectImage(index)}
                className={[
                  "h-1.5 rounded-full transition-all duration-200",
                  selected === index
                    ? "w-4 bg-[var(--accent)]"
                    : "w-1.5 bg-[var(--border-strong)]",
                ].join(" ")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
