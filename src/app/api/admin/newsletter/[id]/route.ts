import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { newsletterRepository } from "src/server/core/repositories";
import { createDeleteRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const DELETE = createDeleteRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => newsletterRepository.delete({ where: { _id: params.id } }),
});
