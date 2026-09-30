import { withTransaction } from "@kira-joo/backend-toolkit-mongoose";
import { ReorderDto } from "src/server/catalog/dto/catalog.dto";
import { HomeSectionModel } from "src/server/content/home-section.schema";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  auth: true,
  body: ReorderDto,
  handler: async ({ body }) =>
    withTransaction(async (tx) => {
      for (const item of body.items) {
        await HomeSectionModel.updateOne({ _id: item.id }, { $set: { sortOrder: item.sortOrder } }, { session: tx.session });
      }
      return tx.complete({ updated: body.items.length });
    }),
  revalidateTags: [CacheTag.HOME],
});
