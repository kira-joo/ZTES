import { mutateReview } from "src/server/catalog/catalog.service";
import { ReviewUpdateDto } from "src/server/catalog/dto/catalog.dto";
import { ReviewModel } from "src/server/catalog/review.schema";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { reviewRepository } from "src/server/core/repositories";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Matches every other admin resource's item route. */
export const GET = createGetRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) => reviewRepository.findOne({ where: { _id: params.id }, relations: ["product"] }),
});

/** Moderation. The product's rating moves in the same transaction. */
export const PUT = createPutRoute({
  auth: true,
  params: ObjectIdParamsDto,
  body: ReviewUpdateDto,
  handler: async ({ params, body }) =>
    mutateReview(params.id, (session) =>
      ReviewModel.findOneAndUpdate({ _id: params.id }, { $set: body }, { session, returnDocument: "after" }).lean()
    ),
  revalidateTags: [CacheTag.REVIEWS, CacheTag.PRODUCTS],
});

export const DELETE = createDeleteRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params }) =>
    mutateReview(params.id, async (session) => {
      await ReviewModel.deleteOne({ _id: params.id }, { session });
      return { deleted: true };
    }),
  revalidateTags: [CacheTag.REVIEWS, CacheTag.PRODUCTS],
});
