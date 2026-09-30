import { ProductDto, ListProductsQueryDto } from "src/server/catalog/dto/catalog.dto";
import { productPayload } from "src/server/catalog/catalog.service";
import { validateDto } from "@kira-joo/backend-toolkit-core";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { productRepository } from "src/server/core/repositories";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

function stockFilter(level: "low" | "out" | undefined) {
  if (level === "out") return { trackStock: true, stock: { $lte: 0 } };
  if (level === "low") return { trackStock: true, stock: { $lte: 5 } };
  return {};
}

export const GET = createGetRoute({
  auth: true,
  query: ListProductsQueryDto,
  handler: async ({ query }) => {
    const { stockLevel, ...rest } = query;
    return productRepository.findAllAndCountPublic({
      query: Object.assign(new ListProductsQueryDto(), rest),
      where: stockFilter(stockLevel) as never,
      relations: ["brand"],
    });
  },
});

/** JSON only: images are added afterwards through the images sub-resource, one per request. */
export const POST = createPostRoute({
  auth: true,
  successStatus: 201,
  handler: async ({ request }) => {
    const dto = await validateDto(ProductDto, await request.json());
    return productRepository.save((await productPayload(dto)) as never);
  },
  revalidateTags: [CacheTag.PRODUCTS],
});
