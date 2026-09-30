import { ListCustomersQueryDto } from "src/server/commerce/dto/commerce.dto";
import { customerRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  query: ListCustomersQueryDto,
  handler: async ({ query }) => customerRepository.findAllAndCountPublic({ query }),
});
