"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CartView } from "src/common/types/cart";
import { useApplyCoupon, useRemoveCoupon } from "./use-cart";

export function CartCouponField({ coupon }: { coupon: CartView["coupon"] }) {
  const t = useTranslations("cart.coupon");
  const [code, setCode] = useState("");
  const { applyCoupon, pending: applying } = useApplyCoupon();
  const { removeCoupon, pending: removing } = useRemoveCoupon();
  const [rejection, setRejection] = useState<string | null>(null);

  if (coupon?.valid) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-brand bg-brand-soft px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-dark">
          <Tag className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate" dir="ltr">
            {coupon.code}
          </span>
        </span>
        <button
          type="button"
          disabled={removing}
          onClick={() => removeCoupon()}
          aria-label={t("remove")}
          className="grid size-8 shrink-0 place-items-center rounded-full text-brand-dark hover:bg-brand/10 disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!code.trim()) return;
        setRejection(null);
        try {
          const result = await applyCoupon(code.trim());
          if (!result.applied && result.rejection) {
            setRejection(result.rejection);
          } else if (result.applied) {
            toast.success(t("applied", { code: code.trim().toUpperCase() }));
            setCode("");
          }
        } catch {
          toast.error(t("label"));
        }
      }}
      className="flex flex-col gap-1.5"
    >
      <label htmlFor="cart-coupon-code" className="text-sm font-semibold text-ink">
        {t("label")}
      </label>
      <div className="flex gap-2">
        <input
          id="cart-coupon-code"
          type="text"
          dir="ltr"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setRejection(null);
          }}
          placeholder={t("placeholder")}
          className="h-11 min-w-0 flex-1 rounded-card border border-line px-3 text-sm uppercase text-ink outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={applying || !code.trim()}
          className="h-11 shrink-0 rounded-card bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {t("apply")}
        </button>
      </div>
      {rejection ? <p className="text-xs font-medium text-sale">{t(`rejection.${rejection}`)}</p> : null}
    </form>
  );
}
