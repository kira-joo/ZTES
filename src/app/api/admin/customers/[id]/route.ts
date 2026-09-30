import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { customerRepository, orderRepository } from "src/server/core/repositories";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => {
    const [customer, orders] = await Promise.all([
      customerRepository.findOne({ where: { _id: params.id } }),
      orderRepository.findAll({ where: { customer: params.id } as never, take: 100 }),
    ]);
    return { customer, orders };
  },
});
