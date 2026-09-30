import { ProductStatusDto } from "src/server/catalog/dto/catalog.dto";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { productRepository } from "src/server/core/repositories";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** The table's activate/deactivate toggle. */
export const PUT = createPutRoute({
  auth: true,
  params: ObjectIdParamsDto,
  body: ProductStatusDto,
  handler: async ({ params, body }) => productRepository.update({ where: { _id: params.id } }, { isActive: body.isActive }),
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id), CacheTag.HOME],
});
