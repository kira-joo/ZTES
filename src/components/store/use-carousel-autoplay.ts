"use client";

import type { UseEmblaCarouselType } from "embla-carousel-react";
import { useEffect, type RefObject } from "react";

type EmblaApi = UseEmblaCarouselType[1];

/**
 * Advances an Embla carousel every `intervalMs`, the one autoplay behaviour
 * every storefront carousel shares. It holds while the user drags, hovers with
 * a mouse or has keyboard focus inside `rootRef`, and while the tab is hidden; any slide change,
 * an arrow click included, restarts the full interval so the next step never
 * lands right after the user's own. Off under `prefers-reduced-motion`.
 */
export function useCarouselAutoplay(
  api: EmblaApi,
  intervalMs: number | undefined,
  rootRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!api || !intervalMs || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const holds = new Set<string>();
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    const schedule = () => {
      stop();
      if (holds.size > 0 || document.hidden) return;
      timer = window.setTimeout(() => {
        // `loop` is off when the slides already fit; then there is nowhere to go but back.
        if (api.canScrollNext()) api.scrollNext();
        else api.scrollTo(0);
      }, intervalMs);
    };
    const hold = (reason: string) => () => {
      holds.add(reason);
      stop();
    };
    const release = (reason: string) => () => {
      holds.delete(reason);
      schedule();
    };

    const onPointerDown = hold("drag");
    const onPointerUp = release("drag");
    // A real mouse only: a tap can fire `mouseenter` with no `mouseleave`, which would stop autoplay for good.
    const onEnter = (event: PointerEvent) => event.pointerType === "mouse" && hold("hover")();
    const onLeave = (event: PointerEvent) => event.pointerType === "mouse" && release("hover")();
    // Keyboard focus only: a mouse click on an arrow focuses it too, and should not stop autoplay.
    const onFocusIn = (event: FocusEvent) =>
      (event.target as Element).matches(":focus-visible") && hold("focus")();
    const onFocusOut = (event: FocusEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) release("focus")();
    };

    api.on("pointerDown", onPointerDown).on("pointerUp", onPointerUp).on("select", schedule);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", schedule);
    schedule();

    return () => {
      stop();
      api.off("pointerDown", onPointerDown).off("pointerUp", onPointerUp).off("select", schedule);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [api, intervalMs, rootRef]);
}
