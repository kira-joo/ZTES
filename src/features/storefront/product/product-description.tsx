"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Collapsible sanitized-HTML description with a "read more/less" toggle, clamped by default. */
export function ProductDescription({ html }: { html: string }) {
  const t = useTranslations("product.description");
  const [expanded, setExpanded] = useState(false);
  if (!html) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-ink">{t("title")}</h2>
      <div
        className={`rich-text relative text-sm text-ink-soft ${expanded ? "" : "max-h-48 overflow-hidden"}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded ? <div aria-hidden="true" className="-mt-10 h-10 bg-gradient-to-t from-card to-transparent" /> : null}
      <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-semibold text-brand-dark hover:underline">
        {expanded ? t("readLess") : t("readMore")}
      </button>
    </section>
  );
}
