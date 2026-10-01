"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type AutoScrollApi = ReturnType<typeof AutoScroll>;

/** Upper bound on repeats of a short row; four covers a row whose cards fill a quarter of the viewport. */
const MAX_COPIES = 4;

/** A repeat is decoration for the loop: hidden from assistive tech and out of the tab order, still clickable. */
function hideRepeat(node: HTMLDivElement | null) {
  node
    ?.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]")
    .forEach((el) => el.setAttribute("tabindex", "-1"));
}

/**
 * Embla, RTL-aware. Slides are laid out by `slideClassName` widths (the
 * reference sets per-breakpoint slide counts per block); arrows on desktop, a
 * thin progress bar underneath like the reference.
 *
 * Every card row glides continuously (Embla's own auto-scroll plugin: a
 * frame-based scroll body, not an interval) and loops seamlessly. It pauses
 * while the user drags, swipes, focuses a card or hovers with a real mouse,
 * and resumes once the row settles. Off under `prefers-reduced-motion`.
 */
export function Carousel({
  children,
  dir,
  slideClassName = "basis-[46%] sm:basis-[31%] lg:basis-[19%]",
  showArrows = true,
  showProgress = true,
  labels,
}: {
  children: ReactNode[];
  dir: "rtl" | "ltr";
  slideClassName?: string;
  showArrows?: boolean;
  showProgress?: boolean;
  labels: { previous: string; next: string };
}) {
  // One plugin instance for the component's life; Embla re-inits only when its options change.
  const [plugins] = useState(() => [
    AutoScroll({
      speed: 0.6,
      startDelay: 1200,
      stopOnInteraction: false,
      stopOnFocusIn: true,
      // `mouseenter` fires on a touch tap with no matching `mouseleave`, which would stop the row for good.
      breakpoints: {
        "(hover: hover) and (pointer: fine)": { stopOnMouseEnter: true },
        "(prefers-reduced-motion: reduce)": { active: false },
      },
    }),
  ]);
  const [viewportRef, api] = useEmblaCarousel(
    { direction: dir, align: "start", loop: true, dragFree: true },
    plugins
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // A row whose cards all fit cannot loop (Embla quietly drops `loop`), so it would sit
  // still; it is repeated until it overflows enough to glide seamlessly like the rest.
  const [copies, setCopies] = useState(1);

  // The bar is written straight to the DOM: it changes every frame while the row glides,
  // and a state update per frame would re-render every card in it.
  const paintProgress = useCallback(() => {
    if (!api || !progressRef.current) return;
    progressRef.current.style.width = `${Math.max(18, Math.max(0, Math.min(1, api.scrollProgress())) * 100)}%`;
  }, [api]);

  const update = useCallback(() => {
    if (!api) return;
    const looping = api.internalEngine().options.loop;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!looping && !reducedMotion && children.length > 1)
      setCopies((count) => Math.min(MAX_COPIES, count + 1));
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
    paintProgress();
  }, [api, paintProgress, children.length]);

  useEffect(() => {
    if (!api) return;
    // The initial read is deferred one microtask so it runs as a callback
    // rather than synchronously inside the effect body — Embla's API object
    // only exists once mounted, so there is no render-time value to read.
    queueMicrotask(update);
    api.on("scroll", paintProgress).on("reInit", update).on("select", update);
    return () => {
      api.off("scroll", paintProgress).off("reInit", update).off("select", update);
    };
  }, [api, update, paintProgress]);

  /** An arrow step: the glide yields to the step, then resumes once it settles unless a mouse is still over the row. */
  const step = useCallback(
    (move: "scrollPrev" | "scrollNext") => {
      if (!api) return;
      const autoScroll = api.plugins().autoScroll as AutoScrollApi | undefined;
      const wasPlaying = autoScroll?.isPlaying() ?? false;
      autoScroll?.stop();
      api[move]();
      // Only a plugin that was playing is initialised; one stopped by a hovering mouse resumes on `mouseleave`.
      if (wasPlaying) {
        api.off("settle", resume);
        api.on("settle", resume);
      }
      function resume() {
        api!.off("settle", resume);
        if (!rootRef.current?.matches(":hover")) autoScroll?.play();
      }
    },
    [api]
  );

  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div ref={rootRef} className="relative">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ms-3 flex touch-pan-y">
          {Array.from({ length: copies }, (_, copy) =>
            children.map((child, index) => (
              <div
                key={`${copy}-${index}`}
                ref={copy > 0 ? hideRepeat : undefined}
                aria-hidden={copy > 0 || undefined}
                className={`min-w-0 shrink-0 grow-0 ps-3 ${slideClassName}`}
              >
                {child}
              </div>
            ))
          )}
        </div>
      </div>
      {showArrows && (canPrev || canNext) ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between md:flex">
          <button
            type="button"
            onClick={() => step("scrollPrev")}
            disabled={!canPrev}
            aria-label={labels.previous}
            className="pointer-events-auto -ms-4 grid size-9 place-items-center rounded-full bg-card text-ink shadow-card disabled:opacity-0"
          >
            <Prev className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step("scrollNext")}
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
            ref={progressRef}
            className="h-full rounded-full bg-brand"
            style={{ width: "18%", marginInlineStart: 0 }}
          />
        </div>
      ) : null}
    </div>
  );
}
