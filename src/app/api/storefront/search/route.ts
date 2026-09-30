import { IsOptional, IsString, MaxLength } from "class-validator";
import { searchCatalog } from "src/server/storefront/search";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

class SearchQueryDto {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
}

/** Live results for the search modal. */
export const GET = createGetRoute({
  auth: false,
  query: SearchQueryDto,
  handler: async ({ query }) => searchCatalog(query.q ?? "", 8),
});
