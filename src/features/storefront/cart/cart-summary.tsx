"use client";

import { useTranslations } from "next-intl";
import type { CartView } from "src/common/types/cart";
import { RiyalSymbol } from "src/components/store/riyal-symbol";
import { Link } from "src/i18n/navigation";
import { formatAmount } from "src/lib/money";

export function CartSummary({
  pricing,
  locale,
  checkoutDisabled,
  onCheckoutBlocked,
}: {
  pricing: CartView["pricing"];
  locale: string;
  checkoutDisabled: boolean;
  onCheckoutBlocked?: () => void;
}) {
  const t = useTranslations("cart");
  const row = (label: string, amount: string, emphasis = false) => (
    <div className={`flex items-center justify-between ${emphasis ? "text-base font-bold text-ink" : "text-sm text-ink-soft"}`}>
      <span>{label}</span>
      <span className={`inline-flex items-center gap-1 ${emphasis ? "text-ink" : ""}`}>
        {formatAmount(amount, locale)}
        <RiyalSymbol />
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 rounded-card bg-card p-5 shadow-card">
      <h2 className="text-lg font-bold text-ink">{t("summary.title")}</h2>
      {row(t("summary.subtotal"), pricing.subtotal)}
      {Number(pricing.couponDiscount) > 0 ? (
        <div className="flex items-center justify-between text-sm text-brand-dark">
          <span>{t("summary.couponDiscount")}</span>
          <span className="inline-flex items-center gap-1">
            -{formatAmount(pricing.couponDiscount, locale)}
            <RiyalSymbol />
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>{t("summary.shipping")}</span>
        <span className="inline-flex items-center gap-1">
          {Number(pricing.shippingFee) === 0 ? (
            t("shipping.free")
          ) : (
            <>
              {formatAmount(pricing.shippingFee, locale)}
              <RiyalSymbol />
            </>
          )}
        </span>
      </div>
      <hr className="border-line" />
      {row(t("summary.total"), pricing.total, true)}
      <p className="text-xs text-ink-muted">{t("summary.vatIncluded", { amount: formatAmount(pricing.vatIncluded, locale) })}</p>

      {checkoutDisabled ? (
        <button
          type="button"
          onClick={onCheckoutBlocked}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-card bg-brand text-sm font-semibold text-white opacity-50"
        >
          {t("summary.checkout")}
        </button>
      ) : (
        <Link href="/checkout" className="mt-2 flex h-12 w-full items-center justify-center rounded-card bg-brand text-sm font-semibold text-white hover:bg-brand-dark">
          {t("summary.checkout")}
        </Link>
      )}
    </div>
  );
}
