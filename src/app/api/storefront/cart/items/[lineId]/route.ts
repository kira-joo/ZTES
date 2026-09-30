import { removeCartLine, updateCartLine } from "src/server/commerce/cart.service";
import { CartLineParamsDto, UpdateCartLineDto } from "src/server/commerce/dto/commerce.dto";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  auth: false,
  params: CartLineParamsDto,
  body: UpdateCartLineDto,
  handler: async ({ params, body }) => updateCartLine(params.lineId, body.quantity),
});

export const DELETE = createDeleteRoute({
  auth: false,
  params: CartLineParamsDto,
  handler: async ({ params }) => removeCartLine(params.lineId),
});
