import { compare, type Money } from "@kira-joo/toolkit-common";

export enum CouponRejection {
  NOT_FOUND = "NOT_FOUND",
  INACTIVE = "INACTIVE",
  NOT_STARTED = "NOT_STARTED",
  EXPIRED = "EXPIRED",
  USAGE_LIMIT = "USAGE_LIMIT",
  MIN_SUBTOTAL = "MIN_SUBTOTAL",
}

export interface CouponRules {
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  minSubtotal?: Money | null;
}

/** Whether a coupon may apply to a cart with this subtotal right now. Pure. */
export function evaluateCoupon(
  coupon: CouponRules | null,
  subtotal: Money,
  now: Date
): { ok: true } | { ok: false; reason: CouponRejection } {
  if (!coupon) return { ok: false, reason: CouponRejection.NOT_FOUND };
  if (!coupon.isActive) return { ok: false, reason: CouponRejection.INACTIVE };
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) return { ok: false, reason: CouponRejection.NOT_STARTED };
  if (coupon.endsAt && coupon.endsAt.getTime() <= now.getTime()) return { ok: false, reason: CouponRejection.EXPIRED };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: CouponRejection.USAGE_LIMIT };
  }
  if (coupon.minSubtotal && compare(subtotal, coupon.minSubtotal) < 0) {
    return { ok: false, reason: CouponRejection.MIN_SUBTOTAL };
  }
  return { ok: true };
}
