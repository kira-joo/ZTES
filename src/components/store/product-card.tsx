import { useTranslations } from "next-intl";
import type { ProductCardView } from "src/common/types/storefront";
import { QuickViewButton } from "src/features/storefront/quick-view/quick-view-button";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { AddToCartButton } from "./add-to-cart-button";
import { Countdown } from "./countdown";
import { Price } from "./price";
import { ProductBadge } from "./product-badge";
import { RatingStars } from "./rating-stars";
import { StoreImage } from "./store-image";
import { WishlistButton } from "./wishlist-button";

/**
 * The reference's product card: square packshot that swaps to the second
 * image on hover (CSS only), badge, single-star rating, wishlist + quick view,
 * brand, two-line title, "VAT included", price with the struck "before"
 * price, a countdown when the sale has an end, and an inline add-to-cart.
 *
 * CONTRACT: `<ProductCard product locale priority? />`.
 */
export function ProductCard({ product, locale, priority = false }: { product: ProductCardView; locale: string; priority?: boolean }) {
  const t = useTranslations("common");
  const name = pickLocalized(product.name, locale);
  const slug = pickSlug(product.slug, locale);
  const href = `/products/${slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card">
      <div className="relative aspect-square overflow-hidden bg-card">
        <Link href={href} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
          <StoreImage image={product.image} alt={name} sizes="(min-width: 1024px) 20vw, 50vw" priority={priority} className="p-3" />
          {product.hoverImage ? (
            <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <StoreImage image={product.hoverImage} alt="" sizes="(min-width: 1024px) 20vw, 50vw" className="bg-card p-3" />
            </span>
          ) : null}
        </Link>
        <div className="pointer-events-none absolute start-2 top-2 flex flex-col items-start gap-1">
          {product.badge ? <ProductBadge badge={product.badge} locale={locale} /> : null}
          {!product.inStock ? (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[0.7rem] font-semibold text-white">{t("outOfStock")}</span>
          ) : null}
        </div>
        <div className="absolute end-2 top-2 flex flex-col gap-1.5">
          <WishlistButton productId={product._id} />
          <QuickViewButton productId={product._id} slug={slug} label={t("quickView")} />
        </div>
        {product.ratingCount > 0 ? (
          <span className="absolute bottom-2 start-2 rounded-full bg-card/95 px-2 py-0.5 shadow-card">
            <RatingStars value={product.ratingAverage} />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand ? (
          <span className="self-start rounded bg-band px-1.5 py-0.5 text-[0.7rem] text-ink-soft">{pickLocalized(product.brand.name, locale)}</span>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink">
          <Link href={href} className="hover:text-brand-dark">
            {name}
          </Link>
        </h3>
        <p className="text-[0.7rem] text-ink-muted">{t("vatIncluded")}</p>
        <Price value={product.price} compareAt={product.compareAtPrice} locale={locale} size="sm" />
        {product.saleEndsAt ? <Countdown endsAt={product.saleEndsAt} size="sm" /> : null}
        <div className="mt-auto pt-2">
          <AddToCartButton
            productId={product._id}
            productName={name}
            slug={slug}
            inStock={product.inStock}
            needsOptions={product.hasRequiredOptions}
          />
        </div>
      </div>
    </article>
  );
}
