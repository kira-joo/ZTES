import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ProductListView } from "src/common/types/storefront";
import { ProductCard } from "src/components/store/product-card";
import { Link } from "src/i18n/navigation";
import { FilterPanel, MobileFilterButton, SortSelect } from "./listing-controls";
import { listingQueryString, type ListingSearchParams } from "./listing-params";

/** The reference's listing layout: filters beside (desktop) or in a drawer (mobile), sort, grid, pages. */
export async function ProductListing({
  list,
  params,
  basePath,
  locale,
}: {
  list: ProductListView;
  params: ListingSearchParams;
  basePath: string;
  locale: string;
}) {
  const t = await getTranslations("listing");
  const hasFacets = list.facets.categories.length > 0 || list.facets.brands.length > 0;

  return (
    <div className={`grid gap-6 ${hasFacets ? "lg:grid-cols-[260px_1fr]" : ""}`}>
      {hasFacets ? (
        <aside className="hidden lg:block" aria-label={t("filters")}>
          <FilterPanel params={params} facets={list.facets} />
        </aside>
      ) : null}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft" aria-live="polite">
            {t("results", { count: list.total })}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilterButton params={params} facets={list.facets} />
            <SortSelect params={params} />
          </div>
        </div>

        {list.items.length === 0 ? (
          <div className="rounded-card bg-card p-10 text-center shadow-card">
            <p className="font-bold text-ink">{t("empty")}</p>
            <p className="mt-1 text-sm text-ink-soft">{t("emptyHint")}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {list.items.map((product, index) => (
              <li key={product._id}>
                <ProductCard product={product} locale={locale} priority={index < 4} />
              </li>
            ))}
          </ul>
        )}

        {list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} params={params} basePath={basePath} locale={locale} label={t("page", { page: list.page, total: list.totalPages })} /> : null}
      </div>
    </div>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((value) => value >= 1 && value <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index > 0 && value - sorted[index - 1]! > 1 ? (["…", value] as const) : ([value] as const)));
}

function Pagination({ page, totalPages, params, basePath, locale, label }: { page: number; totalPages: number; params: ListingSearchParams; basePath: string; locale: string; label: string }) {
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const href = (target: number) => `${basePath}${listingQueryString(params, { page: target })}`;
  const cell = "grid h-10 min-w-10 place-items-center rounded-card border px-2 text-sm font-medium";
  return (
    <nav aria-label={label} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${cell} border-line bg-card text-ink hover:border-brand`}>
          <Prev className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-muted">…</span>
        ) : (
          <Link key={item} href={href(item)} aria-current={item === page ? "page" : undefined} className={`${cell} ${item === page ? "border-brand bg-brand text-white" : "border-line bg-card text-ink hover:border-brand"}`}>
            {item}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${cell} border-line bg-card text-ink hover:border-brand`}>
          <Next className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
