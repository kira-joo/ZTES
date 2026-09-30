"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import type { BranchView } from "src/common/types/storefront";

/** "Visit our branches": a tab per branch, its map embed and hours. */
export function BranchMap({ branches, title, locale }: { branches: BranchView[]; title: string; locale: string }) {
  const [active, setActive] = useState(0);
  if (branches.length === 0) return null;
  const pick = (value: { ar: string; en: string }) => (locale === "en" ? value.en || value.ar : value.ar || value.en);
  const branch = branches[active]!;
  return (
    <section className="overflow-hidden rounded-card bg-card p-5 text-center shadow-card md:p-8">
      <h2 className="text-xl font-bold text-ink md:text-2xl">{title}</h2>
      {pick(branch.hours) ? <p className="mt-2 text-sm text-ink-soft">{pick(branch.hours)}</p> : null}
      <div role="tablist" className="mt-4 flex flex-wrap justify-center gap-2">
        {branches.map((item, index) => (
          <button
            key={item._id}
            role="tab"
            type="button"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-card border px-4 text-sm font-semibold ${
              index === active ? "border-brand bg-brand text-white" : "border-ink/30 text-ink hover:border-brand"
            }`}
          >
            <MapPin className="size-4" aria-hidden="true" />
            {pick(item.name)}
          </button>
        ))}
      </div>
      {pick(branch.address) ? <p className="mt-3 text-sm text-ink-soft">{pick(branch.address)}</p> : null}
      {branch.mapEmbedUrl ? (
        <iframe
          key={branch._id}
          src={branch.mapEmbedUrl}
          title={pick(branch.name)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mt-5 h-72 w-full rounded-card border-0 md:h-96"
        />
      ) : null}
    </section>
  );
}
