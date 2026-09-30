import { findAccessibleOrder } from "src/server/commerce/order-access";
import { OrderNumberParamsDto } from "src/server/core/dto/params.dto";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: false,
  params: OrderNumberParamsDto,
  handler: async ({ params }) => findAccessibleOrder(params.orderNumber),
});
