"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import type { DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { useDebouncedValue } from "@kira-joo/frontend-toolkit-tailwind";
import { searchEndpoint } from "src/common/api/storefront-content.endpoints";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { CategoryNode, ProductCardView } from "src/common/types/storefront";
import { Price } from "src/components/store/price";
import { StoreImage } from "src/components/store/store-image";
import { Link, useRouter } from "src/i18n/navigation";
import { getStorefrontApi } from "src/lib/api-client";
import { pickLocalized, pickSlug } from "src/lib/localized";

export interface SearchSuggestions {
  categories: Pick<CategoryNode, "_id" | "name" | "slug">[];
  products: ProductCardView[];
}

/**
 * The reference's full-screen search: merchandised suggestions while empty,
 * live results as you type, Enter for the full results page.
 */
export function SearchDialog({ titleId, dismiss, suggestions }: DialogContentProps & { suggestions: SearchSuggestions }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // The dialog system's own focus trap claims the panel's first focusable
  // element (its close button) on mount, after this component has already
  // rendered — plain `autoFocus` loses that race. Re-asserting focus one
  // frame later runs after the trap settles; there is no public hook to ask
  // it for the search input instead.
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  const debounced = useDebouncedValue(query.trim(), 250);

  const results = useRequesterQuery({
    endpoint: searchEndpoint,
    client: getStorefrontApi(),
    options: { query: { q: debounced } },
    queryOptions: { enabled: debounced.length >= 2, staleTime: 60_000 },
  });

  const categories = debounced.length >= 2 ? results.data?.categories ?? [] : suggestions.categories;
  const products = debounced.length >= 2 ? results.data?.products ?? [] : suggestions.products;
  const searching = debounced.length >= 2;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pt-14 md:p-8 md:pt-16">
      <h2 id={titleId} className="sr-only">
        {t("searchTitle")}
      </h2>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!query.trim()) return;
          dismiss();
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex items-center gap-2 rounded-card border-2 border-brand bg-card px-4"
      >
        <Search className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
        />
      </form>

      {searching && !results.loading && categories.length === 0 && products.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">{t("noResults", { query: debounced })}</p>
      ) : null}

      {categories.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-bold text-ink">{searching ? t("searchCategories") : t("mostSearchedCategories")}</h3>
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category._id}>
                <Link
                  href={`/categories/${pickSlug(category.slug, locale)}`}
                  onClick={dismiss}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-card px-4 text-sm text-ink hover:border-brand hover:text-brand-dark"
                >
                  {pickLocalized(category.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-bold text-ink">{searching ? t("searchProducts") : t("mostSearchedProducts")}</h3>
          <ul className="divide-y divide-line rounded-card bg-card">
            {products.map((product) => {
              const name = pickLocalized(product.name, locale);
              return (
                <li key={product._id}>
                  <Link
                    href={`/products/${pickSlug(product.slug, locale)}`}
                    onClick={dismiss}
                    className="flex items-center gap-3 p-3 hover:bg-canvas"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-canvas">
                      <StoreImage image={product.image} alt="" sizes="56px" className="p-1" />
                    </span>
                    <span className="line-clamp-2 flex-1 text-sm font-medium text-ink">{name}</span>
                    <Price value={product.price} compareAt={product.compareAtPrice} locale={locale} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ul>
          {searching ? (
            <button
              type="button"
              onClick={() => {
                dismiss();
                router.push(`/search?q=${encodeURIComponent(debounced)}`);
              }}
              className="mt-3 w-full rounded-card border border-brand py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand hover:text-white"
            >
              {t("seeAllResults")}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
