"use client";

import { PartyPopper, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CartView } from "src/common/types/cart";
import { formatAmount } from "src/lib/money";

/** Progress bar toward the free-shipping threshold, or a celebration once unlocked. */
export function FreeShippingBar({ pricing, locale }: { pricing: CartView["pricing"]; locale: string }) {
  const t = useTranslations("cart.shipping");
  if (!pricing.freeShippingThreshold) return null;

  if (pricing.freeShippingApplied) {
    return (
      <div className="flex items-center gap-2 rounded-card bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark">
        <PartyPopper className="size-4 shrink-0" aria-hidden="true" />
        {t("freeApplied")}
      </div>
    );
  }

  const threshold = Number(pricing.freeShippingThreshold);
  const remaining = Number(pricing.amountToFreeShipping ?? "0");
  const progress = threshold > 0 ? Math.max(0, Math.min(100, ((threshold - remaining) / threshold) * 100)) : 0;

  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
        <Truck className="size-4 shrink-0 text-brand-dark" aria-hidden="true" />
        {t("progress", { amount: formatAmount(pricing.amountToFreeShipping ?? "0", locale) })}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-band" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
