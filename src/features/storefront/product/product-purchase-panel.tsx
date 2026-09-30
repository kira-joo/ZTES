"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { ShoppingCart, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProductDetailView } from "src/common/types/storefront";
import { Countdown } from "src/components/store/countdown";
import { Price } from "src/components/store/price";
import { WishlistButton } from "src/components/store/wishlist-button";
import { useAddToCart } from "src/features/storefront/cart/use-cart";
import { useRouter } from "src/i18n/navigation";
import { pickLocalized } from "src/lib/localized";
import { useProductOptions } from "./use-product-options";
import { ProductOptions } from "./product-options";
import { ProductShareButton } from "./product-share-button";
import { QuantityStepper } from "./quantity-stepper";

export function ProductPurchasePanel({ product, locale, shareUrl }: { product: ProductDetailView; locale: string; shareUrl: string }) {
  const t = useTranslations("product");
  const name = pickLocalized(product.name, locale);
  const { addToCart, pending } = useAddToCart();
  const router = useRouter();
  const [showValidation, setShowValidation] = useState(false);

  const options = useProductOptions(product);

  const submit = async (mode: "cart" | "buy") => {
    if (!options.canAddToCart) {
      setShowValidation(true);
      const el = document.getElementById("product-options");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await addToCart({ productId: product._id, optionValueIds: options.optionValueIds, quantity: options.quantity });
      if (mode === "buy") {
        router.push("/checkout");
        return;
      }
      toast.success(t("addedToCart", { name }), t("viewCart"));
    } catch {
      toast.error(t("somethingWrong"));
    }
  };

  const stockLabel = !product.inStock
    ? t("stock.outOfStock")
    : product.trackStock && product.stock <= 5
      ? t("stock.lastUnits", { count: product.stock })
      : t("stock.inStock");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${product.inStock ? "text-brand-dark" : "text-sale"}`}>{stockLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Price value={options.unitPrice} compareAt={options.compareAtPrice} locale={locale} size="lg" />
        <WishlistButton productId={product._id} />
        <ProductShareButton title={name} url={shareUrl} />
      </div>

      {product.saleEndsAt ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">{t("sale.endsIn")}</p>
          <Countdown endsAt={product.saleEndsAt} />
        </div>
      ) : null}

      {product.soldCount > 0 ? <p className="text-sm text-ink-soft">{t("soldCount", { count: product.soldCount })}</p> : null}

      {product.quantityTiers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {product.quantityTiers.map((tier) => (
            <span key={tier.minQuantity} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
              {t("tierHint", { count: tier.minQuantity, percent: tier.percent })}
            </span>
          ))}
        </div>
      ) : null}

      {product.options.length > 0 ? (
        <div id="product-options">
          <ProductOptions
            options={product.options}
            selected={options.selected}
            onSelect={options.select}
            missingGroupIds={showValidation ? options.missingRequiredGroupIds : []}
            locale={locale}
          />
        </div>
      ) : null}

      {product.inStock ? (
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">{t("quantity.label")}</p>
            <QuantityStepper
              value={options.quantity}
              onChange={options.setQuantity}
              max={options.maxQuantity}
              labels={{ decrease: t("quantity.decrease"), increase: t("quantity.increase") }}
            />
          </div>
        </div>
      ) : null}

      {product.inStock ? (
        <div className="hidden gap-3 sm:flex">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("cart")}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-card border border-brand text-sm font-semibold text-brand-dark transition hover:bg-brand hover:text-white disabled:opacity-60"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            {t("addToCart")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("buy")}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-card bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            <Zap className="size-4" aria-hidden="true" />
            {t("buyNow")}
          </button>
        </div>
      ) : null}

      {/* Sticky mobile bar */}
      {product.inStock ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-card p-2.5 shadow-card sm:hidden">
          <QuantityStepper
            value={options.quantity}
            onChange={options.setQuantity}
            max={options.maxQuantity}
            size="sm"
            labels={{ decrease: t("quantity.decrease"), increase: t("quantity.increase") }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("cart")}
            aria-label={t("addToCart")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-card border border-brand text-brand-dark disabled:opacity-60"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("buy")}
            className="h-11 flex-1 rounded-card bg-brand text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("buyNow")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
