import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RatingStars } from "src/components/store/rating-stars";
import { Link } from "src/i18n/navigation";
import { getProductReviews } from "src/server/storefront/catalog.reads";

const PAGE_SIZE = 10;

/**
 * The product's reviews: rating summary, a paginated list. Pagination is a
 * plain `?reviewsPage=` search param — a soft navigation re-renders this
 * Server Component with the next page, so no client endpoint is needed.
 */
export async function ProductReviews({
  productId,
  ratingAverage,
  ratingCount,
  page,
  basePath,
}: {
  productId: string;
  ratingAverage: number;
  ratingCount: number;
  page: number;
  basePath: string;
}) {
  const t = await getTranslations("product.reviews");
  const tr = await getTranslations("product.rating");
  const { items, total } = await getProductReviews(productId, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section id="reviews">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">{t("title")}</h2>
        {ratingCount > 0 ? (
          <div className="flex items-center gap-2 rounded-card bg-card px-3 py-1.5 shadow-card">
            <RatingStars value={ratingAverage} size="md" />
            <span className="text-sm text-ink-soft">{tr("count", { count: ratingCount })}</span>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-card bg-card p-6 text-center text-sm text-ink-soft shadow-card">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((review) => (
            <li key={review._id} className="rounded-card bg-card p-4 shadow-card">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="font-semibold text-ink">{review.authorName}</span>
                <span className="flex items-center gap-0.5" aria-label={t("rating")}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className={`size-3.5 ${index < review.rating ? "fill-star text-star" : "text-line"}`} aria-hidden="true" />
                  ))}
                </span>
              </div>
              {review.body ? <p className="text-sm text-ink-soft">{review.body}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label={t("page", { page, total: totalPages })} className="mt-4 flex justify-center gap-2">
          {page < totalPages ? (
            <Link
              href={`${basePath}?reviewsPage=${page + 1}#reviews`}
              className="rounded-card border border-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand hover:text-white"
            >
              {t("loadMore")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
