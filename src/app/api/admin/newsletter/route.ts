import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { newsletterRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  query: BaseFindQueryDto,
  handler: async ({ query }) => newsletterRepository.findAllAndCountPublic({ query }),
});
