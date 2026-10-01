"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "src/components/store/whatsapp-icon";

/** How far down the page before "back to top" appears. */
const SHOW_AFTER_PX = 320;

/**
 * The storefront's two fixed actions, mounted once in the locale layout:
 * WhatsApp on the start side, back-to-top on the end side, so they never
 * share a corner. `start`/`end` follow the document direction, so Arabic and
 * English mirror each other. On small screens both sit above the product
 * page's fixed purchase bar.
 */
export function FloatingActions({
  whatsapp,
  whatsappLabel,
  backToTopLabel,
}: {
  whatsapp: string;
  whatsappLabel: string;
  backToTopLabel: string;
}) {
  const digits = whatsapp.replace(/\D/g, "");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > SHOW_AFTER_PX);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const button =
    "fixed bottom-5 z-20 grid size-12 place-items-center rounded-full text-white shadow-lg transition-[opacity,translate,scale,visibility,background-color] duration-(--duration-store) ease-(--ease-store) motion-safe:hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none max-md:bottom-24";

  return (
    <>
      {digits ? (
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          title={whatsappLabel}
          className={`${button} start-4 bg-whatsapp`}
        >
          <WhatsAppIcon className="size-6" />
        </a>
      ) : null}
      <button
        type="button"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          })
        }
        aria-label={backToTopLabel}
        title={backToTopLabel}
        aria-hidden={!scrolled}
        tabIndex={scrolled ? 0 : -1}
        className={`${button} end-4 bg-brand-dark hover:bg-brand-deep ${
          scrolled ? "visible opacity-100" : "invisible translate-y-2 opacity-0"
        }`}
      >
        <ArrowUp className="size-6" aria-hidden="true" />
      </button>
    </>
  );
}
