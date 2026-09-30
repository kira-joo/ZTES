// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductOptionType } from "src/common/enums";
import type { ProductDetailView } from "src/common/types/storefront";
import { useProductOptions } from "./use-product-options";

const L = (ar: string) => ({ ar, en: ar });

function makeProduct(overrides: Partial<ProductDetailView> = {}): ProductDetailView {
  return {
    _id: "p1",
    name: L("منتج"),
    slug: { ar: "product", en: "product" },
    brand: null,
    image: null,
    hoverImage: null,
    price: "100.00",
    compareAtPrice: null,
    saleEndsAt: null,
    badge: null,
    ratingAverage: 0,
    ratingCount: 0,
    inStock: true,
    hasRequiredOptions: false,
    description: L(""),
    sku: null,
    images: [],
    stock: 50,
    trackStock: true,
    weight: L(""),
    options: [],
    quantityTiers: [],
    soldCount: 0,
    primaryCategory: null,
    breadcrumb: [],
    brandId: null,
    seo: { title: L(""), description: L("") },
    ...overrides,
  };
}

describe("useProductOptions", () => {
  it("recomputes the unit price from selected option deltas, rounded once", () => {
    const product = makeProduct({
      price: "100.00",
      compareAtPrice: "120.00",
      options: [
        {
          _id: "g1",
          name: L("اللون"),
          type: ProductOptionType.TEXT,
          required: true,
          values: [
            { _id: "v1", label: L("أحمر"), priceDelta: "0.00", image: null, isAvailable: true },
            { _id: "v2", label: L("ذهبي"), priceDelta: "15.50", image: null, isAvailable: true },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useProductOptions(product));

    expect(result.current.unitPrice).toBe("100.00");
    expect(result.current.canAddToCart).toBe(false); // required group unselected
    expect(result.current.missingRequiredGroupIds).toEqual(["g1"]);

    act(() => result.current.select("g1", "v2"));

    expect(result.current.unitPrice).toBe("115.50");
    expect(result.current.compareAtPrice).toBe("135.50");
    expect(result.current.canAddToCart).toBe(true);
    expect(result.current.optionValueIds).toEqual(["v2"]);
  });

  it("keeps an unavailable selected value from allowing add-to-cart", () => {
    const product = makeProduct({
      options: [
        {
          _id: "g1",
          name: L("الحجم"),
          type: ProductOptionType.TEXT,
          required: false,
          values: [{ _id: "v1", label: L("كبير"), priceDelta: "0.00", image: null, isAvailable: false }],
        },
      ],
    });
    const { result } = renderHook(() => useProductOptions(product));
    act(() => result.current.select("g1", "v1"));
    expect(result.current.canAddToCart).toBe(false);
  });

  it("bounds quantity between 1 and stock when trackStock is on", () => {
    const product = makeProduct({ trackStock: true, stock: 3 });
    const { result } = renderHook(() => useProductOptions(product));
    act(() => result.current.setQuantity(10));
    expect(result.current.quantity).toBe(3);
    act(() => result.current.setQuantity(0));
    expect(result.current.quantity).toBe(1);
  });

  it("reports the next quantity tier and the currently-applied one", () => {
    const product = makeProduct({ quantityTiers: [{ minQuantity: 2, percent: 10 }, { minQuantity: 5, percent: 20 }] });
    const { result } = renderHook(() => useProductOptions(product));
    expect(result.current.tierHint).toEqual({ currentPercent: 0, next: { minQuantity: 2, percent: 10 } });
    act(() => result.current.setQuantity(2));
    expect(result.current.tierHint).toEqual({ currentPercent: 10, next: { minQuantity: 5, percent: 20 } });
    act(() => result.current.setQuantity(5));
    expect(result.current.tierHint).toEqual({ currentPercent: 20, next: null });
  });
});
