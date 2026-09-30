// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { describe, expect, it } from "vitest";
import { CouponType } from "src/common/enums";
import { calculatePricing, priceLine } from "./pricing";

const base = { shippingFee: toMoney(9), freeShippingThreshold: toMoney(199), vatRate: 15 };
const line = (unit: number | string, quantity: number, tiers: { minQuantity: number; percent: number }[] = []) => ({
  key: `l${unit}`,
  unitPrice: toMoney(unit),
  quantity,
  tiers,
});

describe("priceLine", () => {
  it("multiplies the unit price by quantity", () => {
    expect(priceLine(line("89.00", 3)).lineTotal.toFixed(2)).toBe("267.00");
  });

  it("applies the best reached tier and reports the next one", () => {
    const tiers = [
      { minQuantity: 2, percent: 10 },
      { minQuantity: 3, percent: 15 },
    ];
    const one = priceLine(line(229, 1, tiers));
    expect(one.tierPercent).toBe(0);
    expect(one.nextTier).toEqual({ minQuantity: 2, percent: 10 });

    const two = priceLine(line(229, 2, tiers));
    expect(two.tierDiscount.toFixed(2)).toBe("45.80");
    expect(two.lineTotal.toFixed(2)).toBe("412.20");
    expect(two.nextTier).toEqual({ minQuantity: 3, percent: 15 });

    const four = priceLine(line(229, 4, tiers));
    expect(four.tierPercent).toBe(15);
    expect(four.nextTier).toBeNull();
  });

  it("rejects a non-integer or zero quantity", () => {
    expect(() => priceLine(line(10, 0))).toThrow();
    expect(() => priceLine(line(10, 1.5))).toThrow();
  });
});

describe("calculatePricing", () => {
  it("reproduces the reference cart: 229 total, 29.87 VAT inside, free delivery", () => {
    const result = calculatePricing({ ...base, lines: [line(229, 1)] });
    expect(result.total.toFixed(2)).toBe("229.00");
    expect(result.vatIncluded.toFixed(2)).toBe("29.87");
    expect(result.totalBeforeVat.toFixed(2)).toBe("199.13");
    expect(result.shippingFee.toFixed(2)).toBe("0.00");
    expect(result.freeShippingApplied).toBe(true);
  });

  it("charges the fee one cent below the threshold and waives it at the threshold", () => {
    const below = calculatePricing({ ...base, lines: [line("198.99", 1)] });
    expect(below.shippingFee.toFixed(2)).toBe("9.00");
    expect(below.total.toFixed(2)).toBe("207.99");
    expect(below.amountToFreeShipping?.toFixed(2)).toBe("0.01");

    const at = calculatePricing({ ...base, lines: [line("199.00", 1)] });
    expect(at.shippingFee.toFixed(2)).toBe("0.00");
    expect(at.amountToFreeShipping).toBeNull();
  });

  it("measures the free-shipping threshold after the coupon", () => {
    const result = calculatePricing({
      ...base,
      lines: [line(200, 1)],
      coupon: { type: CouponType.FIXED, value: toMoney(10), freeShipping: false },
    });
    expect(result.couponDiscount.toFixed(2)).toBe("10.00");
    expect(result.shippingFee.toFixed(2)).toBe("9.00");
    expect(result.total.toFixed(2)).toBe("199.00");
  });

  it("caps a percent coupon at maxDiscount and a fixed coupon at the subtotal", () => {
    const capped = calculatePricing({
      ...base,
      lines: [line(1000, 1)],
      coupon: { type: CouponType.PERCENT, value: toMoney(10), maxDiscount: toMoney(50), freeShipping: false },
    });
    expect(capped.couponDiscount.toFixed(2)).toBe("50.00");

    const fixed = calculatePricing({
      ...base,
      lines: [line(20, 1)],
      coupon: { type: CouponType.FIXED, value: toMoney(100), freeShipping: false },
    });
    expect(fixed.couponDiscount.toFixed(2)).toBe("20.00");
    expect(fixed.total.toFixed(2)).toBe("9.00");
  });

  it("a free-shipping coupon waives delivery under the threshold", () => {
    const result = calculatePricing({
      ...base,
      lines: [line(50, 1)],
      coupon: { type: CouponType.PERCENT, value: toMoney(0), freeShipping: true },
    });
    expect(result.shippingFee.toFixed(2)).toBe("0.00");
    expect(result.total.toFixed(2)).toBe("50.00");
  });

  it("stays exact where floats drift (0.1 + 0.2)", () => {
    const result = calculatePricing({ ...base, freeShippingThreshold: null, lines: [line("0.10", 1), line("0.20", 1)] });
    expect(result.subtotal.toFixed(2)).toBe("0.30");
    expect(result.total.toFixed(2)).toBe("9.30");
  });

  it("an empty cart costs nothing and ships nothing", () => {
    const result = calculatePricing({ ...base, lines: [] });
    expect(result.total.toFixed(2)).toBe("0.00");
    expect(result.shippingFee.toFixed(2)).toBe("0.00");
  });

  it("never-free delivery reports no remaining amount", () => {
    const result = calculatePricing({ ...base, freeShippingThreshold: null, lines: [line(500, 1)] });
    expect(result.shippingFee.toFixed(2)).toBe("9.00");
    expect(result.amountToFreeShipping).toBeNull();
  });
});
