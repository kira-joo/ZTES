import { ArrayMaxSize, IsArray, IsMongoId, IsOptional } from "class-validator";
import { ToArray } from "@kira-joo/backend-toolkit-core";
import { getProductsByIds } from "src/server/storefront/catalog.reads";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

class ProductsByIdsQueryDto {
  @IsOptional() @ToArray() @IsArray() @ArrayMaxSize(200) @IsMongoId({ each: true }) ids?: string[];
}

/** Product cards by id, in the order asked — the device-local wishlist page. */
export const GET = createGetRoute({
  auth: false,
  query: ProductsByIdsQueryDto,
  handler: async ({ query }) => getProductsByIds(query.ids ?? []),
});
