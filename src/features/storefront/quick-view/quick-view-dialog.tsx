"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import type { DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { productDetailEndpoint } from "api/storefront-content.endpoints";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ProductDetailView } from "src/common/types/storefront";
import { Price } from "src/components/store/price";
import { RatingStars } from "src/components/store/rating-stars";
import { StoreImage } from "src/components/store/store-image";
import { useAddToCart } from "src/features/storefront/cart/use-cart";
import { ProductOptions } from "src/features/storefront/product/product-options";
import { QuantityStepper } from "src/features/storefront/product/quantity-stepper";
import { useProductOptions } from "src/features/storefront/product/use-product-options";
import { Link } from "src/i18n/navigation";
import { getStorefrontApi } from "src/lib/api-client";
import { pickLocalized, pickSlug } from "src/lib/localized";

/** Rendered only once `product` has loaded, so `useProductOptions` mounts at a stable hook order. */
function QuickViewProduct({ product, dismiss }: { product: ProductDetailView; dismiss: () => void }) {
  const t = useTranslations("product");
  const tq = useTranslations("product.quickView");
  const locale = useLocale();
  const { addToCart, pending } = useAddToCart();
  const [showValidation, setShowValidation] = useState(false);
  const options = useProductOptions(product);

  const name = pickLocalized(product.name, locale);
  const slug = pickSlug(product.slug, locale);

  const submit = async () => {
    if (!options.canAddToCart) {
      setShowValidation(true);
      return;
    }
    try {
      await addToCart({ productId: product._id, optionValueIds: options.optionValueIds, quantity: options.quantity });
      toast.success(t("addedToCart", { name }), t("viewCart"));
      dismiss();
    } catch {
      toast.error(t("somethingWrong"));
    }
  };

  return (
    <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
      <div className="relative aspect-square overflow-hidden rounded-card bg-canvas">
        <StoreImage image={product.images[0] ?? product.image} alt={name} sizes="(min-width: 768px) 40vw, 90vw" className="p-4" priority />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-muted">{t("vatIncluded")}</p>
        <h3 className="text-lg font-bold text-ink">{name}</h3>
        {product.ratingCount > 0 ? <RatingStars value={product.ratingAverage} count={product.ratingCount} /> : null}
        <Price value={options.unitPrice} compareAt={options.compareAtPrice} locale={locale} size="lg" />

        {product.options.length > 0 ? (
          <ProductOptions
            options={product.options}
            selected={options.selected}
            onSelect={options.select}
            missingGroupIds={showValidation ? options.missingRequiredGroupIds : []}
            locale={locale}
          />
        ) : null}

        {product.inStock ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <QuantityStepper
              value={options.quantity}
              onChange={options.setQuantity}
              max={options.maxQuantity}
              labels={{ decrease: t("quantity.decrease"), increase: t("quantity.increase") }}
            />
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-card bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              <ShoppingCart className="size-4" aria-hidden="true" />
              {t("addToCart")}
            </button>
          </div>
        ) : (
          <p className="font-semibold text-sale">{t("stock.outOfStock")}</p>
        )}

        <Link
          href={`/products/${slug}`}
          onClick={dismiss}
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
        >
          {tq("viewFullDetails")}
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** The quick-view dialog's body: fetches the product client-side, then delegates to `QuickViewProduct`. */
export function QuickViewBody({ productId, dismiss, titleId }: DialogContentProps & { productId: string }) {
  const t = useTranslations("product");
  const query = useRequesterQuery({
    endpoint: productDetailEndpoint,
    client: getStorefrontApi(),
    options: { params: { id: productId } },
  });

  return (
    <div>
      <h2 id={titleId} className="sr-only">
        {t("quickView.title")}
      </h2>
      {query.loading ? (
        <div className="grid h-80 place-items-center p-6">
          <span className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" role="status" aria-label={t("quickView.title")} />
        </div>
      ) : query.error || !query.data ? (
        <div className="p-6 text-center">
          <p className="font-semibold text-ink">{t("notFound.title")}</p>
          <button type="button" onClick={dismiss} className="mt-3 text-sm font-semibold text-brand-dark hover:underline">
            {t("gallery.close")}
          </button>
        </div>
      ) : (
        <QuickViewProduct product={query.data} dismiss={dismiss} />
      )}
    </div>
  );
}
