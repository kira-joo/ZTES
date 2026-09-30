"use client";

import { AlertTriangle, Heart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { CartLineView } from "src/common/types/cart";
import { Price } from "src/components/store/price";
import { QuantityStepper } from "src/features/storefront/product/quantity-stepper";
import { useWishlist } from "src/features/storefront/wishlist/use-wishlist";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { formatAmount } from "src/lib/money";
import { TierUpsellCard } from "./tier-upsell-card";
import { useRemoveCartLine, useUpdateCartLine } from "./use-cart";

export function CartLineItem({ line, locale }: { line: CartLineView; locale: string }) {
  const t = useTranslations("cart");
  const tq = useTranslations("product.quantity");
  const { updateLine } = useUpdateCartLine();
  const { removeLine, pending: removing } = useRemoveCartLine();
  const { toggle: toggleWishlist } = useWishlist();

  const name = pickLocalized(line.name, locale);
  const slug = pickSlug(line.slug, locale);
  const weight = line.weight ? pickLocalized(line.weight, locale) : "";

  const moveToWishlist = () => {
    toggleWishlist(line.productId);
    void removeLine(line.lineId);
  };

  return (
    <li className={`rounded-card bg-card p-3 shadow-card ${line.issue ? "ring-1 ring-sale/40" : ""}`}>
      <div className="flex gap-3">
        <Link href={`/products/${slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-canvas sm:size-24">
          {line.imageUrl ? (
            <Image src={line.imageUrl} alt={name} fill sizes="96px" className="object-contain p-1" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-band/60" />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/products/${slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-dark">
              {name}
            </Link>
            <Price value={line.unitPrice} locale={locale} size="sm" />
          </div>
          {weight ? <p className="text-xs text-ink-muted">{t("line.weight", { weight })}</p> : null}
          {line.options.length > 0 ? (
            <p className="text-xs text-ink-muted">
              {line.options.map((option) => `${pickLocalized(option.group, locale)}: ${pickLocalized(option.value, locale)}`).join(" · ")}
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <QuantityStepper
              value={line.quantity}
              onChange={(next) => updateLine(line.lineId, next)}
              max={line.available ?? 99}
              size="sm"
              labels={{ decrease: tq("decrease"), increase: tq("increase") }}
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={moveToWishlist}
                aria-label={t("line.moveToWishlist")}
                title={t("line.moveToWishlist")}
                className="grid size-9 place-items-center rounded-full text-ink-muted hover:text-brand-dark"
              >
                <Heart className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => removeLine(line.lineId)}
                aria-label={t("line.remove")}
                title={t("line.remove")}
                className="grid size-9 place-items-center rounded-full text-ink-muted hover:text-sale disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {line.tierPercent > 0 ? (
              <p className="text-xs font-semibold text-brand-dark">{t("line.tierDiscount", { amount: formatAmount(line.tierDiscount, locale) })}</p>
            ) : (
              <span />
            )}
            <p className="text-sm font-bold text-ink">{formatAmount(line.lineTotal, locale)}</p>
          </div>
        </div>
      </div>

      {line.issue ? (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-sale-soft px-3 py-2 text-xs font-medium text-sale">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          {t(`issue.${line.issue}`, { available: line.available ?? 0 })}
        </p>
      ) : null}

      {line.nextTier ? (
        <div className="mt-2">
          <TierUpsellCard line={line} locale={locale} />
        </div>
      ) : null}
    </li>
  );
}
