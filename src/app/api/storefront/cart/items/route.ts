import { addCartLine } from "src/server/commerce/cart.service";
import { AddCartLineDto } from "src/server/commerce/dto/commerce.dto";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const POST = createPostRoute({
  auth: false,
  body: AddCartLineDto,
  handler: async ({ body }) =>
    addCartLine({ productId: body.productId, optionValueIds: body.optionValueIds ?? [], quantity: body.quantity }),
});
