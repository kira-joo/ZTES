"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWishlist } from "src/features/storefront/wishlist/use-wishlist";

export function WishlistButton({ productId, className = "" }: { productId: string; className?: string }) {
  const t = useTranslations("common");
  const { has, toggle } = useWishlist();
  const active = has(productId);
  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={active}
      aria-label={active ? t("removeFromWishlist") : t("addToWishlist")}
      className={`grid size-9 place-items-center rounded-full bg-card shadow-card transition ${active ? "text-sale" : "text-ink hover:text-sale"} ${className}`}
    >
      <Heart className={`size-4 ${active ? "fill-sale" : ""}`} aria-hidden="true" />
    </button>
  );
}
