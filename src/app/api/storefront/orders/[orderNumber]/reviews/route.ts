import { BadRequestError, ConflictError } from "@kira-joo/backend-toolkit-core";
import { withTransaction } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { OrderStatus } from "src/common/enums";
import { ReviewModel } from "src/server/catalog/review.schema";
import { recomputeProductRating } from "src/server/catalog/catalog.service";
import { SubmitReviewDto } from "src/server/commerce/dto/commerce.dto";
import { findAccessibleOrder } from "src/server/commerce/order-access";
import { OrderNumberParamsDto } from "src/server/core/dto/params.dto";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * A buyer reviews a product from a delivered order — the no-accounts stand-in
 * for "verified purchase". Publishes immediately: there is no admin
 * review-management screen to moderate it (see docs/implementation-plan.md's
 * "Scope correction"), so the rating updates in the same transaction.
 */
export const POST = createPostRoute({
  auth: false,
  params: OrderNumberParamsDto,
  body: SubmitReviewDto,
  successStatus: 201,
  handler: async ({ params, body, request }) => {
    await enforceRateLimit({ key: `review:${resolveClientIp(request)}`, ...RATE_LIMITS.REVIEW });
    const order = await findAccessibleOrder(params.orderNumber);
    if (order.status !== OrderStatus.DELIVERED) throw new BadRequestError("Reviews open once the order is delivered.");
    if (!order.lines.some((line) => String(line.product) === body.productId)) {
      throw new BadRequestError("That product is not in this order.");
    }
    const productId = new mongoose.Types.ObjectId(body.productId);
    try {
      await withTransaction(async (tx) => {
        await ReviewModel.create(
          [
            {
              product: productId,
              order: order._id,
              authorName: body.authorName,
              rating: body.rating,
              body: body.body ?? "",
              isPublished: true,
            },
          ],
          { session: tx.session }
        );
        await recomputeProductRating(productId, tx.session);
        return tx.complete(undefined);
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError("You already reviewed this product.");
      throw error;
    }
    return { submitted: true };
  },
});
