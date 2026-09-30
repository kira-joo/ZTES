import { MONEY_SCALE, ZERO, compare, roundMoney, toMoney, type Money } from "@kira-joo/toolkit-common";
import { CouponType } from "src/common/enums";

/**
 * The one place a price becomes a total. Pure: the cart, the checkout summary
 * and order placement all call this with what they read, so the number a
 * customer sees and the number they are charged come from the same code.
 *
 * Order of operations (fixed, documented in docs/implementation-plan.md):
 *   line gross = (price + Σ option deltas) × quantity
 *   line total = gross − best quantity tier percent
 *   subtotal   = Σ line totals
 *   coupon     = PERCENT of subtotal (capped by maxDiscount) | FIXED (capped at subtotal)
 *   shipping   = 0 if coupon.freeShipping or (subtotal − coupon) ≥ threshold, else fee
 *   total      = subtotal − coupon + shipping
 *   VAT inside = total × rate ÷ (100 + rate)
 *
 * Every stored amount is rounded once, where it becomes a stored amount. Rates
 * are applied as `.mul(rate).div(100)` — never `.mul(rate / 100)`.
 */

export interface PricingLineInput {
  key: string;
  unitPrice: Money;
  quantity: number;
  tiers: readonly { minQuantity: number; percent: number }[];
}

export interface PricingCouponInput {
  type: CouponType;
  value: Money;
  maxDiscount?: Money | null;
  freeShipping: boolean;
}

export interface PricingInput {
  lines: readonly PricingLineInput[];
  coupon?: PricingCouponInput | null;
  shippingFee: Money;
  freeShippingThreshold?: Money | null;
  vatRate: number;
}

export interface PricedLine {
  key: string;
  unitPrice: Money;
  quantity: number;
  lineGross: Money;
  tierPercent: number;
  tierDiscount: Money;
  lineTotal: Money;
  /** The next tier this line could reach, for the "add one more" upsell. */
  nextTier: { minQuantity: number; percent: number } | null;
}

export interface PricingResult {
  lines: PricedLine[];
  subtotal: Money;
  couponDiscount: Money;
  shippingFee: Money;
  total: Money;
  vatIncluded: Money;
  /** total − vatIncluded, the reference cart's "before tax" line. */
  totalBeforeVat: Money;
  vatRate: number;
  /** How much more the customer must add for free delivery; null when already free or never free. */
  amountToFreeShipping: Money | null;
  freeShippingApplied: boolean;
}

function bestTier(tiers: PricingLineInput["tiers"], quantity: number) {
  return tiers
    .filter((tier) => quantity >= tier.minQuantity)
    .reduce<{ minQuantity: number; percent: number } | null>(
      (best, tier) => (!best || tier.percent > best.percent ? tier : best),
      null
    );
}

function nextTier(tiers: PricingLineInput["tiers"], quantity: number) {
  const current = bestTier(tiers, quantity)?.percent ?? 0;
  return (
    [...tiers]
      .filter((tier) => tier.minQuantity > quantity && tier.percent > current)
      .sort((a, b) => a.minQuantity - b.minQuantity)[0] ?? null
  );
}

export function priceLine(line: PricingLineInput): PricedLine {
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new Error(`Quantity must be a positive integer (got ${line.quantity}).`);
  }
  const unitPrice = roundMoney(line.unitPrice);
  const lineGross = roundMoney(unitPrice.mul(line.quantity));
  const tier = bestTier(line.tiers, line.quantity);
  const tierPercent = tier?.percent ?? 0;
  const tierDiscount = tierPercent ? roundMoney(lineGross.mul(tierPercent).div(100)) : ZERO;

  return {
    key: line.key,
    unitPrice,
    quantity: line.quantity,
    lineGross,
    tierPercent,
    tierDiscount,
    lineTotal: lineGross.minus(tierDiscount),
    nextTier: nextTier(line.tiers, line.quantity),
  };
}

export function couponDiscountFor(coupon: PricingCouponInput, subtotal: Money): Money {
  if (coupon.type === CouponType.PERCENT) {
    let discount = roundMoney(subtotal.mul(coupon.value).div(100));
    if (coupon.maxDiscount && compare(discount, coupon.maxDiscount) > 0) discount = roundMoney(coupon.maxDiscount);
    return compare(discount, subtotal) > 0 ? subtotal : discount;
  }
  const fixed = roundMoney(coupon.value);
  return compare(fixed, subtotal) > 0 ? subtotal : fixed;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const lines = input.lines.map(priceLine);
  const subtotal = lines.reduce<Money>((acc, line) => acc.plus(line.lineTotal), ZERO);

  const couponDiscount = input.coupon ? couponDiscountFor(input.coupon, subtotal) : ZERO;
  const afterCoupon = subtotal.minus(couponDiscount);

  const threshold = input.freeShippingThreshold ?? null;
  const reachedThreshold = threshold !== null && compare(afterCoupon, threshold) >= 0;
  const freeShippingApplied = lines.length > 0 && (Boolean(input.coupon?.freeShipping) || reachedThreshold);
  const shippingFee = lines.length === 0 || freeShippingApplied ? ZERO : roundMoney(input.shippingFee);

  const total = afterCoupon.plus(shippingFee);
  const vatIncluded = input.vatRate > 0 ? roundMoney(total.mul(input.vatRate).div(100 + input.vatRate)) : ZERO;

  return {
    lines,
    subtotal,
    couponDiscount,
    shippingFee,
    total,
    vatIncluded,
    totalBeforeVat: total.minus(vatIncluded),
    vatRate: input.vatRate,
    amountToFreeShipping:
      threshold !== null && !freeShippingApplied ? toMoney(threshold).minus(afterCoupon) : null,
    freeShippingApplied,
  };
}

export { MONEY_SCALE };
