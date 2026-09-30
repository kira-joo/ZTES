import { validateDto } from "@kira-joo/backend-toolkit-core";
import { productPayload } from "src/server/catalog/catalog.service";
import { ProductDto } from "src/server/catalog/dto/catalog.dto";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { productRepository } from "src/server/core/repositories";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => productRepository.findOne({ where: { _id: params.id } }),
});

/** Replaces everything except the gallery, which has its own sub-resource. */
export const PUT = createPutRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params, request }) => {
    const dto = await validateDto(ProductDto, await request.json());
    return productRepository.update({ where: { _id: params.id } }, (await productPayload(dto)) as never);
  },
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id)],
});

/** Soft delete: past orders snapshot the product, and the admin can restore it. */
export const DELETE = createDeleteRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => productRepository.softDelete({ where: { _id: params.id } }),
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id)],
});
