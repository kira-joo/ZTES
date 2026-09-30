import { ListOrdersQueryDto } from "src/server/commerce/dto/commerce.dto";
import { orderRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  query: ListOrdersQueryDto,
  handler: async ({ query }) => {
    const { from, to, ...rest } = query;
    const createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
    return orderRepository.findAllAndCountPublic({
      query: Object.assign(new ListOrdersQueryDto(), rest),
      ...(from || to ? { where: { createdAt } as never } : {}),
    });
  },
});
