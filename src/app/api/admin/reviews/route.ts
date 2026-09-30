import { ListReviewsQueryDto } from "src/server/catalog/dto/catalog.dto";
import { reviewRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  query: ListReviewsQueryDto,
  handler: async ({ query }) => reviewRepository.findAllAndCountPublic({ query, relations: ["product"] }),
});
