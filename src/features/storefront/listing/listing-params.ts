import { ProductSort } from "src/common/enums";

export interface ListingSearchParams {
  sort?: ProductSort;
  page?: number;
  brands: string[];
  categories: string[];
}

const SORTS = new Set(Object.values(ProductSort));

/** Parses `?sort=&page=&brand=&brand=&category=` — URL state keeps listings server-rendered and indexable. */
export function parseListingParams(raw: Record<string, string | string[] | undefined>): ListingSearchParams {
  const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value : value ? [value] : []).filter((item) => /^[a-f0-9]{24}$/.test(item));
  const sort = typeof raw.sort === "string" && SORTS.has(raw.sort as ProductSort) ? (raw.sort as ProductSort) : undefined;
  const page = Number(raw.page);
  return {
    ...(sort ? { sort } : {}),
    ...(Number.isInteger(page) && page > 1 ? { page } : {}),
    brands: list(raw.brand),
    categories: list(raw.category),
  };
}

export function listingQueryString(params: ListingSearchParams, overrides: Partial<ListingSearchParams> = {}): string {
  const next = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (next.sort && next.sort !== ProductSort.SUGGESTED) query.set("sort", next.sort);
  if (next.page && next.page > 1) query.set("page", String(next.page));
  next.brands.forEach((id) => query.append("brand", id));
  next.categories.forEach((id) => query.append("category", id));
  const text = query.toString();
  return text ? `?${text}` : "";
}
