"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { SettingsView } from "src/common/types/storefront";
import { SmartLink } from "src/components/store/smart-link";

const KEY = "ztes:popup-dismissed";

/**
 * The admin-configured promotional popup. Shown once, a few seconds after the
 * first page view, never again once dismissed (storage permitting). Never
 * blocks the page it opens over: it is a small dismissible card.
 */
export function PromoPopup({ popup, locale, closeLabel, dismissLabel }: { popup: SettingsView["popup"]; locale: string; closeLabel: string; dismissLabel: string }) {
  const [open, setOpen] = useState(false);
  const title = popup.title[locale as "ar" | "en"] || popup.title.ar;
  const body = popup.body[locale as "ar" | "en"] || popup.body.ar;
  const cta = popup.ctaLabel[locale as "ar" | "en"] || popup.ctaLabel.ar;

  useEffect(() => {
    if (!popup.isActive || !title) return;
    try {
      if (window.localStorage.getItem(KEY) === title) return;
    } catch {
      /* storage unavailable: show once per page load */
    }
    const id = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(id);
  }, [popup.isActive, title]);

  if (!open) return null;
  const close = (remember: boolean) => {
    setOpen(false);
    if (remember) {
      try {
        window.localStorage.setItem(KEY, title);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div role="dialog" aria-label={title} className="store-sheet fixed bottom-4 end-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card bg-card shadow-lg">
      <button type="button" onClick={() => close(false)} aria-label={closeLabel} className="absolute end-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-card/90 text-ink">
        <X className="size-4" aria-hidden="true" />
      </button>
      {popup.image?.secureUrl ? (
        <div className="relative aspect-[16/9]">
          <Image src={popup.image.secureUrl} alt="" fill sizes="22rem" className="object-cover" />
        </div>
      ) : null}
      <div className="space-y-3 p-5">
        <p className="text-lg font-bold text-ink">{title}</p>
        {body ? <div className="rich-text text-sm text-ink-soft" dangerouslySetInnerHTML={{ __html: body }} /> : null}
        {cta && popup.ctaHref ? (
          <SmartLink href={popup.ctaHref} onClick={() => close(true)} className="block rounded-card bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark">
            {cta}
          </SmartLink>
        ) : null}
        <button type="button" onClick={() => close(true)} className="w-full text-center text-xs text-ink-muted underline">
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
