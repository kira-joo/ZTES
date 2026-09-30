import { applyCartCoupon, removeCartCoupon } from "src/server/commerce/cart.service";
import { ApplyCouponDto } from "src/server/commerce/dto/commerce.dto";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Rate-limited so codes cannot be enumerated. A rejection is data in the response, not an error. */
export const PUT = createPutRoute({
  auth: false,
  body: ApplyCouponDto,
  handler: async ({ body, request }) => {
    await enforceRateLimit({ key: `coupon:${resolveClientIp(request)}`, ...RATE_LIMITS.COUPON });
    return applyCartCoupon(body.code);
  },
});

export const DELETE = createDeleteRoute({
  auth: false,
  handler: async () => removeCartCoupon(),
});
