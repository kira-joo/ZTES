// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ProductSort } from "src/common/enums";
import { listingQueryString, parseListingParams } from "./listing-params";

describe("parseListingParams", () => {
  it("keeps a known sort and drops an unknown one", () => {
    expect(parseListingParams({ sort: ProductSort.PRICE_LOW }).sort).toBe(ProductSort.PRICE_LOW);
    expect(parseListingParams({ sort: "nonsense" }).sort).toBeUndefined();
  });

  it("only keeps page when it is a real page beyond 1", () => {
    expect(parseListingParams({ page: "3" }).page).toBe(3);
    expect(parseListingParams({ page: "1" }).page).toBeUndefined();
    expect(parseListingParams({ page: "abc" }).page).toBeUndefined();
  });

  it("filters brand/category values to valid Mongo ids", () => {
    const id = "a".repeat(24);
    const result = parseListingParams({ brand: [id, "not-an-id"], category: id });
    expect(result.brands).toEqual([id]);
    expect(result.categories).toEqual([id]);
  });
});

describe("listingQueryString", () => {
  const base = { brands: [], categories: [] };

  it("is empty for the suggested sort on page 1 with no facets", () => {
    expect(listingQueryString({ ...base, sort: ProductSort.SUGGESTED, page: 1 })).toBe("");
  });

  it("round-trips sort, page and repeated facet params", () => {
    const id1 = "a".repeat(24);
    const id2 = "b".repeat(24);
    const query = listingQueryString({ sort: ProductSort.PRICE_HIGH, page: 3, brands: [id1, id2], categories: [] });
    const parsed = parseListingParams(Object.fromEntries(new URLSearchParams(query.slice(1))));
    expect(parsed.sort).toBe(ProductSort.PRICE_HIGH);
    expect(parsed.page).toBe(3);
  });

  it("overrides only the given fields", () => {
    const query = listingQueryString({ sort: ProductSort.TOP_RATED, page: 2, brands: ["a".repeat(24)], categories: [] }, { page: 1 });
    expect(query).toContain("sort=");
    expect(query).not.toContain("page=");
  });
});
