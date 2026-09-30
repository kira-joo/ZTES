"use client";

import { drawerPresentation, useDialog, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { ProductSort } from "src/common/enums";
import type { FacetOption } from "src/common/types/storefront";
import { usePathname, useRouter } from "src/i18n/navigation";
import { pickLocalized } from "src/lib/localized";
import { listingQueryString, type ListingSearchParams } from "./listing-params";

function useApply(params: ListingSearchParams) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const apply = (overrides: Partial<ListingSearchParams>) =>
    startTransition(() => router.push(`${pathname}${listingQueryString(params, { page: 1, ...overrides })}`, { scroll: false }));
  return { apply, pending };
}

export function SortSelect({ params }: { params: ListingSearchParams }) {
  const t = useTranslations("listing");
  const { apply } = useApply(params);
  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft">
      <span className="hidden sm:inline">{t("sortBy")}</span>
      <select
        value={params.sort ?? ProductSort.SUGGESTED}
        onChange={(event) => apply({ sort: event.target.value as ProductSort })}
        className="h-10 rounded-card border border-line bg-card px-3 text-sm text-ink focus:border-brand focus:outline-none"
      >
        {Object.values(ProductSort).map((sort) => (
          <option key={sort} value={sort}>
            {t(`sort.${sort}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FacetGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const t = useTranslations("listing");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(
    () => options.filter((option) => pickLocalized(option.name, locale).toLowerCase().includes(query.trim().toLowerCase())),
    [options, query, locale]
  );
  if (options.length === 0) return null;
  const visible = expanded ? filtered : filtered.slice(0, 6);

  return (
    <details open className="group rounded-card bg-card p-4 shadow-card">
      <summary className="cursor-pointer list-none font-bold text-ink [&::-webkit-details-marker]:hidden">{title}</summary>
      {options.length > 6 ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchInFilter")}
          aria-label={`${title} — ${t("searchInFilter")}`}
          className="mt-3 h-9 w-full rounded-lg border border-line px-3 text-sm focus:border-brand focus:outline-none"
        />
      ) : null}
      <ul className="mt-3 grid gap-1">
        {visible.map((option) => (
          <li key={option._id}>
            <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={selected.includes(option._id)}
                onChange={() => onToggle(option._id)}
                className="size-4 accent-[var(--color-brand)]"
              />
              <span className="flex-1">{pickLocalized(option.name, locale)}</span>
              <span className="text-xs text-ink-muted">({option.count})</span>
            </label>
          </li>
        ))}
      </ul>
      {filtered.length > 6 ? (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-medium text-brand-dark">
          {expanded ? t("showLess") : t("showMore")}
        </button>
      ) : null}
    </details>
  );
}

export function FilterPanel({ params, facets }: { params: ListingSearchParams; facets: { categories: FacetOption[]; brands: FacetOption[] } }) {
  const t = useTranslations("listing");
  const { apply, pending } = useApply(params);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  const hasFilters = params.brands.length > 0 || params.categories.length > 0;
  return (
    <div className={`grid gap-3 ${pending ? "opacity-60" : ""}`}>
      <FacetGroup title={t("categories")} options={facets.categories} selected={params.categories} onToggle={(id) => apply({ categories: toggle(params.categories, id) })} />
      <FacetGroup title={t("brands")} options={facets.brands} selected={params.brands} onToggle={(id) => apply({ brands: toggle(params.brands, id) })} />
      {hasFilters ? (
        <button type="button" onClick={() => apply({ brands: [], categories: [] })} className="text-sm font-medium text-sale">
          {t("clearFilters")}
        </button>
      ) : null}
    </div>
  );
}

function FilterDrawer({ titleId, params, facets, dismiss }: DialogContentProps & { params: ListingSearchParams; facets: { categories: FacetOption[]; brands: FacetOption[] } }) {
  const t = useTranslations("listing");
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <h2 id={titleId} className="border-b border-line bg-card px-4 py-4 pe-12 font-bold text-ink">
        {t("filters")}
      </h2>
      <div className="flex-1 p-4">
        <FilterPanel params={params} facets={facets} />
      </div>
      <div className="sticky bottom-0 border-t border-line bg-card p-4">
        <button type="button" onClick={dismiss} className="w-full rounded-card bg-brand py-3 font-semibold text-white">
          {t("applyFilters")}
        </button>
      </div>
    </div>
  );
}

export function MobileFilterButton({ params, facets }: { params: ListingSearchParams; facets: { categories: FacetOption[]; brands: FacetOption[] } }) {
  const t = useTranslations("listing");
  const { openDialog } = useDialog();
  const active = params.brands.length + params.categories.length;
  if (facets.brands.length === 0 && facets.categories.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => openDialog({ component: FilterDrawer, props: { params, facets }, presentation: drawerPresentation({ side: "inline-start", className: "store-drawer-start" }) })}
      className="inline-flex h-10 items-center gap-2 rounded-card border border-line bg-card px-3 text-sm font-medium text-ink lg:hidden"
    >
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      {t("filters")}
      {active ? <span className="grid size-5 place-items-center rounded-full bg-brand text-xs text-white">{active}</span> : null}
    </button>
  );
}
