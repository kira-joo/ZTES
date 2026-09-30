import { BadRequestError, ConflictError } from "@kira-joo/backend-toolkit-core";
import mongoose from "mongoose";
import { OrderStatus } from "src/common/enums";
import { ReviewModel } from "src/server/catalog/review.schema";
import { SubmitReviewDto } from "src/server/commerce/dto/commerce.dto";
import { findAccessibleOrder } from "src/server/commerce/order-access";
import { OrderNumberParamsDto } from "src/server/core/dto/params.dto";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * A buyer reviews a product from a delivered order — the no-accounts stand-in
 * for "verified purchase". Held for moderation (unpublished) until the admin
 * publishes it, which is also when it starts counting toward the rating.
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
    try {
      await ReviewModel.create({
        product: new mongoose.Types.ObjectId(body.productId),
        order: order._id,
        authorName: body.authorName,
        rating: body.rating,
        body: body.body ?? "",
        isPublished: false,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError("You already reviewed this product.");
      throw error;
    }
    return { submitted: true };
  },
});
