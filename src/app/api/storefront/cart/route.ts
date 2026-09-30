import { buildCartView, currentCart } from "src/server/commerce/cart.service";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: false,
  handler: async () => buildCartView(await currentCart({ create: false })),
});
