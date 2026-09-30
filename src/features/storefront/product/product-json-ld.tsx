import type { ProductDetailView, ReviewView } from "src/common/types/storefront";
import { JsonLd } from "src/features/storefront/seo/json-ld";
import { pickLocalized } from "src/lib/localized";
import { STORE_CURRENCY } from "src/common/config/store";

/**
 * Product/Offer/AggregateRating/Review structured data. Kept local to the
 * product track (the shared `seo/json-ld.tsx` only has Organization/WebSite/
 * BreadcrumbList) — reuses the shared `<JsonLd>` serializer.
 */
export function ProductJsonLd({
  product,
  url,
  locale,
  reviews,
}: {
  product: ProductDetailView;
  url: string;
  locale: string;
  reviews: ReviewView[];
}) {
  const name = pickLocalized(product.name, locale);
  const description = pickLocalized(product.description, locale).replace(/<[^>]+>/g, "").slice(0, 500);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        ...(description ? { description } : {}),
        ...(product.sku ? { sku: product.sku } : {}),
        image: product.images.map((image) => image.secureUrl).filter(Boolean),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: STORE_CURRENCY,
          price: product.price,
          availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(product.ratingCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.ratingAverage,
                reviewCount: product.ratingCount,
              },
            }
          : {}),
        ...(reviews.length > 0
          ? {
              review: reviews.map((review) => ({
                "@type": "Review",
                author: { "@type": "Person", name: review.authorName },
                datePublished: review.reviewedAt,
                reviewBody: review.body,
                reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
              })),
            }
          : {}),
      }}
    />
  );
}
