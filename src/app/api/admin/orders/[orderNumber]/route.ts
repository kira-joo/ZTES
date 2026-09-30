import { allowedTransitions } from "src/server/engines/order-state";
import { OrderNumberParamsDto } from "src/server/core/dto/params.dto";
import { orderRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  params: OrderNumberParamsDto,
  handler: async ({ params }) => {
    const order = await orderRepository.findOne({ where: { orderNumber: params.orderNumber }, relations: ["customer"] });
    return { ...order, allowedTransitions: allowedTransitions(order.status) };
  },
});
