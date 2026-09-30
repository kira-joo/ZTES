import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { PlaceOrderDto } from "src/server/commerce/dto/commerce.dto";
import { placeOrder } from "src/server/commerce/place-order";
import { clearCartToken, readCartToken, rememberOrderToken } from "src/server/commerce/storefront-cookies";
import { sha256 } from "src/server/core/crypto";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * Places a cash-on-delivery order. Idempotent on the client's
 * `Idempotency-Key`: a retried submit returns the first result instead of a
 * second order. Stock changed, so product reads are invalidated.
 */
export const POST = createPostRoute({
  auth: false,
  idempotent: true,
  successStatus: 201,
  body: PlaceOrderDto,
  handler: async ({ body, request }) => {
    await enforceRateLimit({ key: `order:${resolveClientIp(request)}`, ...RATE_LIMITS.ORDER_PLACEMENT });
    const token = await readCartToken();
    if (!token) throw new NotFoundError("Cart not found.");

    const placed = await placeOrder({
      cartTokenHash: sha256(token),
      contact: body.contact,
      address: body.address,
      customerNotes: body.customerNotes,
      safeUseAccepted: body.safeUseAccepted,
      locale: body.locale,
    });

    await rememberOrderToken(placed.orderNumber, placed.accessToken);
    await clearCartToken();
    return { orderNumber: placed.orderNumber };
  },
  revalidateTags: [CacheTag.PRODUCTS],
});
