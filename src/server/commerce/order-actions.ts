import { ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { withTransaction } from "@kira-joo/backend-toolkit-mongoose";
import { OrderStatus, TimelineActor } from "src/common/enums";
import { ProductModel } from "src/server/catalog/product.schema";
import { canTransition, releasesInventory } from "src/server/engines/order-state";
import { CouponModel } from "./coupon.schema";
import { OrderModel, type OrderSchema } from "./order.schema";

/**
 * Moves an order to its next status. Cancelling returns the stock, the sold
 * count and the coupon redemption in the same transaction as the status
 * change, so a cancelled order can never leave inventory short.
 *
 * The status guard is part of the update filter: two admins clicking at once
 * cannot both apply a transition from the same starting state.
 */
export async function transitionOrder(input: {
  orderNumber: string;
  to: OrderStatus;
  note?: string;
  now?: Date;
}): Promise<OrderSchema> {
  const now = input.now ?? new Date();

  return withTransaction(async (tx) => {
    const session = tx.session;
    const order = await OrderModel.findOne({ orderNumber: input.orderNumber }).session(session).lean<OrderSchema>();
    if (!order) throw new NotFoundError("Order not found.");
    if (!canTransition(order.status, input.to)) {
      throw new ConflictError(`An order that is ${order.status} cannot become ${input.to}.`, {
        reason: "INVALID_TRANSITION",
        from: order.status,
        to: input.to,
      });
    }

    const updated = await OrderModel.findOneAndUpdate(
      { _id: order._id, status: order.status },
      {
        $set: {
          status: input.to,
          ...(input.to === OrderStatus.CANCELLED ? { cancellationReason: input.note?.trim() ?? "" } : {}),
        },
        $push: { timeline: { status: input.to, at: now, actor: TimelineActor.ADMIN, note: input.note?.trim() ?? "" } },
      },
      { session, returnDocument: "after" }
    ).lean<OrderSchema>();
    if (!updated) throw new ConflictError("The order changed while you were editing it. Reload and try again.");

    if (releasesInventory(input.to)) {
      const quantities = new Map<string, number>();
      for (const line of order.lines) {
        quantities.set(String(line.product), (quantities.get(String(line.product)) ?? 0) + line.quantity);
      }
      for (const [productId, quantity] of quantities) {
        const product = await ProductModel.findById(productId).session(session).select("trackStock").lean();
        if (!product) continue;
        await ProductModel.updateOne(
          { _id: productId },
          { $inc: { soldCount: -quantity, ...(product.trackStock ? { stock: quantity } : {}) } },
          { session }
        );
      }
      if (order.coupon?.coupon) {
        await CouponModel.updateOne({ _id: order.coupon.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });
      }
    }

    return tx.complete(updated);
  });
}
