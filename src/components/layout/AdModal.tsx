"use client";

/**
 * AdModal — Fullscreen advertising modal shown to site visitors.
 *
 * Behaviour:
 * - Shown on first visit (no localStorage key present)
 * - Reshown after 3 days (AD_COOLDOWN_MS)
 * - Carousel with dot + arrow navigation when multiple ads exist
 * - Desktop image (image_url) shown on md+ screens
 * - Mobile image (image_mobile_url) shown on smaller screens (falls back to desktop image)
 * - Clicking the ad image navigates to link_url (if set)
 * - Closing writes timestamp to localStorage
 * - Body scroll locked while open
 * - Animated with framer-motion (overlay fade, panel slide-up)
 */

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Ad } from "@/types/database";

// ── Constants ─────────────────────────────────────────────────

const STORAGE_KEY = "j14_ads_dismissed_at";
const AD_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ── Helpers ───────────────────────────────────────────────────

function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    return isNaN(ts) || Date.now() - ts >= AD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function recordDismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

// ── Sub-components ────────────────────────────────────────────

function AdImage({ ad, priority }: { ad: Ad; priority?: boolean }) {
  const desktopSrc = ad.image_url;
  const mobileSrc = ad.image_mobile_url ?? ad.image_url;

  return (
    <>
      {/* Mobile image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobileSrc}
        alt={ad.title}
        className="block md:hidden w-full h-full object-cover"
        draggable={false}
        loading={priority ? "eager" : "lazy"}
      />
      {/* Desktop image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktopSrc}
        alt={ad.title}
        className="hidden md:block w-full h-full object-cover"
        draggable={false}
        loading={priority ? "eager" : "lazy"}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────

interface AdModalProps {
  ads: Ad[];
}

export default function AdModal({ ads }: AdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 prev, +1 next

  // Mount check — only open if cooldown has passed
  // TODO: Remove the `true` override below and restore `shouldShow()` after testing.
  useEffect(() => {
    if (ads.length === 0) return;
    if (true /* shouldShow() — always show during testing */) {
      // Small delay so page content loads first (better perceived perf)
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [ads.length]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleClose = useCallback(() => {
    recordDismiss();
    setIsOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % ads.length);
  }, [ads.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + ads.length) % ads.length);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[current];
  const hasMultiple = ads.length > 1;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ad-backdrop"
            className="fixed inset-0 z-9000 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="ad-panel"
            role="dialog"
            aria-modal="true"
            aria-label={ad.title}
            className={[
              "fixed z-9001 inset-0 flex items-center justify-center p-3 sm:p-6 pointer-events-none",
            ].join(" ")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-black"
              style={{
                /* Mobile: tall portrait box; Desktop: wide landscape */
                aspectRatio: "unset",
              }}
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Image area */}
              <div
                className={[
                  "relative overflow-hidden",
                  /* Mobile: portrait 3:4 ratio; Desktop: landscape 16:9 */
                  "aspect-3/4 md:aspect-video",
                ].join(" ")}
              >
                <AnimatePresence custom={direction} mode="popLayout" initial={false}>
                  <motion.div
                    key={`ad-slide-${ad.id}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0"
                  >
                    {/* Clickable image */}
                    {ad.link_url ? (
                      <a
                        href={ad.link_url}
                        onClick={handleClose}
                        className="block h-full w-full"
                        aria-label={`Ver más: ${ad.title}`}
                      >
                        <AdImage ad={ad} priority={current === 0} />
                        {/* "Ver más" pill on hover */}
                        <div className="absolute inset-0 flex items-end justify-center pb-14 md:pb-16 opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <span className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-1.5 text-[13px] font-semibold text-foreground shadow-lg">
                            Ver más →
                          </span>
                        </div>
                      </a>
                    ) : (
                      <div className="h-full w-full">
                        <AdImage ad={ad} priority={current === 0} />
                      </div>
                    )}

                    {/* Gradient overlay for title area */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 to-transparent pointer-events-none" />
                  </motion.div>
                </AnimatePresence>

                {/* Title */}
                <div className="absolute bottom-0 inset-x-0 px-5 pb-4 pt-8 pointer-events-none">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={`title-${ad.id}`}
                      className="text-white font-semibold text-[18px] md:text-[22px] leading-snug drop-shadow-lg line-clamp-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      {ad.title}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  aria-label="Cerrar anuncio"
                  className={[
                    "absolute top-3 right-3 z-10",
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-black/50 text-white backdrop-blur-sm",
                    "transition-colors duration-150 hover:bg-black/75",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  ].join(" ")}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="1" y1="1" x2="13" y2="13" />
                    <line x1="13" y1="1" x2="1" y2="13" />
                  </svg>
                </button>

                {/* Carousel arrows (only when multiple ads) */}
                {hasMultiple && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      aria-label="Anuncio anterior"
                      className={[
                        "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        "bg-black/50 text-white backdrop-blur-sm",
                        "transition-all duration-150 hover:bg-black/75 hover:scale-110",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                      ].join(" ")}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 2 4 7 9 12" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      aria-label="Anuncio siguiente"
                      className={[
                        "absolute right-3 top-1/2 -translate-y-1/2 z-10",
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        "bg-black/50 text-white backdrop-blur-sm",
                        "transition-all duration-150 hover:bg-black/75 hover:scale-110",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                      ].join(" ")}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="5 2 10 7 5 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Dot navigation (only when multiple ads) */}
              {hasMultiple && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10" role="tablist" aria-label="Slides del anuncio">
                  {ads.map((a, i) => (
                    <button
                      key={a.id}
                      role="tab"
                      aria-selected={i === current}
                      aria-label={`Ir al anuncio ${i + 1}`}
                      onClick={(e) => { e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }}
                      className={[
                        "rounded-full transition-all duration-200",
                        i === current
                          ? "bg-white w-5 h-2"
                          : "bg-white/50 hover:bg-white/75 w-2 h-2",
                      ].join(" ")}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
