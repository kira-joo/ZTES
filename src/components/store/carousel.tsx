"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

/**
 * Embla, RTL-aware. Slides are laid out by `slideClassName` widths (the
 * reference sets per-breakpoint slide counts per block); arrows on desktop, a
 * thin progress bar underneath like the reference.
 */
export function Carousel({
  children,
  dir,
  slideClassName = "basis-[46%] sm:basis-[31%] lg:basis-[19%]",
  autoplayMs,
  showArrows = true,
  showProgress = true,
  labels,
}: {
  children: ReactNode[];
  dir: "rtl" | "ltr";
  slideClassName?: string;
  autoplayMs?: number;
  showArrows?: boolean;
  showProgress?: boolean;
  labels: { previous: string; next: string };
}) {
  const [viewportRef, api] = useEmblaCarousel({ direction: dir, align: "start", containScroll: "trimSnaps", loop: Boolean(autoplayMs) });
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!api) return;
    setProgress(Math.max(0, Math.min(1, api.scrollProgress())));
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    // The initial read is deferred one microtask so it runs as a callback
    // rather than synchronously inside the effect body — Embla's API object
    // only exists once mounted, so there is no render-time value to read.
    queueMicrotask(update);
    api.on("scroll", update).on("reInit", update).on("select", update);
    return () => {
      api.off("scroll", update).off("reInit", update).off("select", update);
    };
  }, [api, update]);

  useEffect(() => {
    if (!api || !autoplayMs) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => api.scrollNext(), autoplayMs);
    return () => window.clearInterval(id);
  }, [api, autoplayMs]);

  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="relative">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ms-3 flex touch-pan-y">
          {children.map((child, index) => (
            <div key={index} className={`min-w-0 shrink-0 grow-0 ps-3 ${slideClassName}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {showArrows && (canPrev || canNext) ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between md:flex">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            disabled={!canPrev}
            aria-label={labels.previous}
            className="pointer-events-auto -ms-4 grid size-9 place-items-center rounded-full bg-card text-ink shadow-card disabled:opacity-0"
          >
            <Prev className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            disabled={!canNext}
            aria-label={labels.next}
            className="pointer-events-auto -me-4 grid size-9 place-items-center rounded-full bg-card text-ink shadow-card disabled:opacity-0"
          >
            <Next className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {showProgress && (canPrev || canNext) ? (
        <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-150"
            style={{ width: `${Math.max(18, progress * 100)}%`, marginInlineStart: 0 }}
          />
        </div>
      ) : null}
    </div>
  );
}
