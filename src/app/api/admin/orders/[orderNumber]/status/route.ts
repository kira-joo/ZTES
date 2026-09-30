import { TransitionOrderDto } from "src/server/commerce/dto/commerce.dto";
import { transitionOrder } from "src/server/commerce/order-actions";
import { OrderNumberParamsDto } from "src/server/core/dto/params.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { allowedTransitions } from "src/server/engines/order-state";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  auth: true,
  params: OrderNumberParamsDto,
  body: TransitionOrderDto,
  handler: async ({ params, body }) => {
    const order = await transitionOrder({ orderNumber: params.orderNumber, to: body.status, note: body.note });
    return { ...order, allowedTransitions: allowedTransitions(order.status) };
  },
  // Cancelling returns stock, which the storefront shows.
  revalidateTags: ({ body }) => (body.status === "CANCELLED" ? [CacheTag.PRODUCTS] : []),
});
