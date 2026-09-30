import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  handler: async ({ user }) => ({ id: user._id, name: user.name }),
});
