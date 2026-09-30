import { withTransaction } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { assertValidCategoryParent } from "src/server/catalog/catalog.service";
import { CategoryModel } from "src/server/catalog/category.schema";
import { ReorderDto } from "src/server/catalog/dto/catalog.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Saves the tree editor's order (and any re-parenting) as one transaction. */
export const PUT = createPutRoute({
  auth: true,
  body: ReorderDto,
  handler: async ({ body }) => {
    for (const item of body.items) {
      if (item.parent !== undefined) await assertValidCategoryParent(item.id, item.parent);
    }
    return withTransaction(async (tx) => {
      for (const item of body.items) {
        await CategoryModel.updateOne(
          { _id: item.id },
          {
            $set: {
              sortOrder: item.sortOrder,
              ...(item.parent !== undefined ? { parent: item.parent ? new mongoose.Types.ObjectId(item.parent) : null } : {}),
            },
          },
          { session: tx.session }
        );
      }
      return tx.complete({ updated: body.items.length });
    });
  },
  revalidateTags: [CacheTag.CATEGORIES],
});
