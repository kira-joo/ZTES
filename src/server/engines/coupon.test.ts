// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { describe, expect, it } from "vitest";
import { CouponRejection, evaluateCoupon } from "./coupon";

const now = new Date("2026-09-30T12:00:00Z");
const ok = { isActive: true, usedCount: 0 };

describe("evaluateCoupon", () => {
  it("accepts an unrestricted active coupon", () => expect(evaluateCoupon(ok, toMoney(1), now)).toEqual({ ok: true }));
  it.each([
    [null, CouponRejection.NOT_FOUND],
    [{ ...ok, isActive: false }, CouponRejection.INACTIVE],
    [{ ...ok, startsAt: new Date("2026-10-01T00:00:00Z") }, CouponRejection.NOT_STARTED],
    [{ ...ok, endsAt: now }, CouponRejection.EXPIRED],
    [{ ...ok, usageLimit: 5, usedCount: 5 }, CouponRejection.USAGE_LIMIT],
    [{ ...ok, minSubtotal: toMoney("100.00") }, CouponRejection.MIN_SUBTOTAL],
  ])("rejects %#", (coupon, reason) => {
    expect(evaluateCoupon(coupon, toMoney("99.99"), now)).toEqual({ ok: false, reason });
  });
  it("accepts exactly the minimum subtotal", () =>
    expect(evaluateCoupon({ ...ok, minSubtotal: toMoney(100) }, toMoney("100.00"), now)).toEqual({ ok: true }));
});
