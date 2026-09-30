import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { getProductById } from "src/server/storefront/catalog.reads";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Product detail for the quick-view dialog. */
export const GET = createGetRoute({
  auth: false,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => {
    const product = await getProductById(params.id);
    if (!product) throw new NotFoundError("Product not found.");
    return product;
  },
});
