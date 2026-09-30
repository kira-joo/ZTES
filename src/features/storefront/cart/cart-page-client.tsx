"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Link } from "src/i18n/navigation";
import { CartCouponField } from "./cart-coupon-field";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import { FreeShippingBar } from "./free-shipping-bar";
import { GiftCard } from "./gift-dialog";
import { SafeUseCheckbox } from "./safe-use-checkbox";
import { useCart } from "./use-cart";
import { cartSignature, useSafeUseAcceptance } from "./use-safe-use";

/**
 * `relatedRail` is a Server Component (`<ProductRail>`, which itself calls
 * `getTranslations` from `next-intl/server`) rendered by the server page
 * wrapper and passed down as an already-rendered node — never imported or
 * rendered directly in this Client Component. `ProductRail` is `async` and
 * server-only; mounting it here would ship `next-intl/server` into the
 * browser bundle and throw at runtime ("`getTranslations` is not supported in
 * Client Components") the moment the cart has a line to render it beside.
 */
export function CartPageClient({
  locale,
  safeUseTitle,
  safeUseText,
  relatedRail,
}: {
  locale: string;
  safeUseTitle: string;
  safeUseText: string;
  relatedRail: ReactNode;
}) {
  const t = useTranslations("cart");
  const { cart, loading } = useCart();
  const [accepted, setAccepted] = useSafeUseAcceptance(cartSignature(cart));
  const [showSafeUseError, setShowSafeUseError] = useState(false);

  if (loading && !cart) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-card bg-card shadow-card" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-card shadow-card" />
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="rounded-card bg-card p-10 text-center shadow-card">
        <ShoppingBag className="mx-auto mb-3 size-10 text-ink-muted" aria-hidden="true" />
        <p className="font-bold text-ink">{t("empty.title")}</p>
        <p className="mt-1 text-sm text-ink-soft">{t("empty.body")}</p>
        <Link href="/" className="mt-4 inline-block rounded-card bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          {t("empty.cta")}
        </Link>
      </div>
    );
  }

  const checkoutBlocked = cart.hasIssues || !accepted;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-4">
          <FreeShippingBar pricing={cart.pricing} locale={locale} />
          <ul className="flex flex-col gap-3">
            {cart.lines.map((line) => (
              <CartLineItem key={line.lineId} line={line} locale={locale} />
            ))}
          </ul>
          <GiftCard gift={cart.gift} />
          <SafeUseCheckbox
            title={safeUseTitle}
            text={safeUseText}
            checked={accepted}
            onChange={(next) => {
              setAccepted(next);
              if (next) setShowSafeUseError(false);
            }}
            showRequiredError={showSafeUseError && !accepted}
          />
        </div>

        <div className="flex flex-col gap-4">
          <CartCouponField coupon={cart.coupon} />
          <CartSummary
            pricing={cart.pricing}
            locale={locale}
            checkoutDisabled={checkoutBlocked}
            onCheckoutBlocked={() => setShowSafeUseError(!accepted)}
          />
        </div>
      </div>

      {relatedRail}
    </div>
  );
}
