"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { Copy, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CouponPublicView } from "src/common/types/storefront";
import { pickLocalized } from "src/lib/localized";

/** A copyable coupon box for a home SPOTLIGHT section's coupon, when one resolves. */
export function ProductCouponBox({ coupon, locale }: { coupon: CouponPublicView; locale: string }) {
  const t = useTranslations("product.coupon");
  const description = pickLocalized(coupon.description, locale);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success(t("copied"));
    } catch {
      /* clipboard unavailable — the code is still visible to copy by hand */
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-card border border-dashed border-brand bg-brand-soft p-3">
      <Tag className="size-5 shrink-0 text-brand-dark" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-soft">{t("label")}</p>
        <p className="truncate font-bold tabular-nums text-ink" dir="ltr">
          {coupon.code}
        </p>
        {description ? <p className="mt-0.5 truncate text-xs text-ink-soft">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-card border border-brand bg-card px-3 text-xs font-semibold text-brand-dark hover:bg-brand hover:text-white"
      >
        <Copy className="size-3.5" aria-hidden="true" />
        {t("copy")}
      </button>
    </div>
  );
}
