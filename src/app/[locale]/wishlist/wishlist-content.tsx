"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { productsByIdsEndpoint } from "src/common/api/storefront-content.endpoints";
import { HeartOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard } from "src/components/store/product-card";
import { useWishlist } from "src/features/storefront/wishlist/use-wishlist";
import { Link } from "src/i18n/navigation";
import { getStorefrontApi } from "src/lib/api-client";

/**
 * Client-only: the wishlist is a device-local id list (no accounts), so its
 * cards are fetched by id from the browser, never rendered server-side.
 */
export function WishlistContent({ locale }: { locale: string }) {
  const t = useTranslations("product.wishlistPage");
  const { ids } = useWishlist();

  const query = useRequesterQuery({
    endpoint: productsByIdsEndpoint,
    client: getStorefrontApi(),
    options: { query: { ids } },
    queryOptions: { enabled: ids.length > 0 },
  });

  if (ids.length === 0) {
    return (
      <div className="rounded-card bg-card p-10 text-center shadow-card">
        <HeartOff className="mx-auto mb-3 size-10 text-ink-muted" aria-hidden="true" />
        <p className="font-bold text-ink">{t("empty.title")}</p>
        <p className="mt-1 text-sm text-ink-soft">{t("empty.body")}</p>
        <Link href="/" className="mt-4 inline-block rounded-card bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          {t("empty.cta")}
        </Link>
      </div>
    );
  }

  if (query.loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {ids.map((id) => (
          <div key={id} className="aspect-[3/4] animate-pulse rounded-card bg-card shadow-card" />
        ))}
      </div>
    );
  }

  const items = query.data ?? [];
  // Ids no longer resolving to a real product (deleted/deactivated) are simply absent from the response.
  const byId = new Map(items.map((item) => [item._id, item]));
  const ordered = ids.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {ordered.map((product) => (
        <li key={product._id}>
          <ProductCard product={product} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
