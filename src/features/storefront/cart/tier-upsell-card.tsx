"use client";

import { useTranslations } from "next-intl";
import type { CartLineView } from "src/common/types/cart";
import { pickLocalized } from "src/lib/localized";
import { useUpdateCartLine } from "./use-cart";

/** "Add one more and save 10%" upsell for a line that has a `nextTier` within reach. */
export function TierUpsellCard({ line, locale }: { line: CartLineView; locale: string }) {
  const t = useTranslations("cart.tierUpsell");
  const { updateLine, pending } = useUpdateCartLine();
  if (!line.nextTier) return null;
  const name = pickLocalized(line.name, locale);

  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-brand-soft px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-dark">{t("title", { percent: line.nextTier.percent })}</p>
        <p className="truncate text-xs text-ink-soft">{name}</p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => updateLine(line.lineId, line.nextTier!.minQuantity)}
        className="shrink-0 rounded-card bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {t("addOne")}
      </button>
    </div>
  );
}
