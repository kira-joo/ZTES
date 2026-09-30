"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddToCart } from "src/features/storefront/cart/use-cart";
import { useRouter } from "src/i18n/navigation";

/**
 * The card's inline add-to-cart. A product with required options cannot be
 * added blind, so it goes to its page instead — exactly what the reference's
 * card does.
 */
export function AddToCartButton({
  productId,
  productName,
  slug,
  inStock,
  needsOptions,
}: {
  productId: string;
  productName: string;
  slug: string;
  inStock: boolean;
  needsOptions: boolean;
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const { addToCart, pending } = useAddToCart();

  if (!inStock) {
    return (
      <span className="flex h-10 items-center justify-center rounded-card border border-line text-sm font-semibold text-ink-muted">
        {t("outOfStock")}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (needsOptions) {
          router.push(`/products/${slug}`);
          return;
        }
        try {
          await addToCart({ productId, quantity: 1 });
          toast.success(t("addedToCart"), productName);
        } catch {
          toast.error(t("somethingWrong"));
        }
      }}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-card border border-brand text-sm font-semibold text-brand-dark transition-colors hover:bg-brand hover:text-white disabled:opacity-60"
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      {pending ? t("adding") : needsOptions ? t("chooseOptions") : t("addToCart")}
    </button>
  );
}
