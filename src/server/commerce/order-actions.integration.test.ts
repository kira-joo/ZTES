// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { Locale, OrderStatus } from "src/common/enums";
import { ProductModel } from "src/server/catalog/product.schema";
import { address, contact, makeCart, makeCoupon, makeProduct, seedSettings } from "src/test/fixtures";
import { setupTestDatabase } from "src/test/mongo";
import { CouponModel } from "./coupon.schema";
import { transitionOrder } from "./order-actions";
import { OrderModel } from "./order.schema";
import { placeOrder } from "./place-order";

setupTestDatabase();

async function placed(stock = 5, quantity = 2) {
  await seedSettings();
  const product = await makeProduct({ stock });
  await makeCoupon({ code: "SAVE10" });
  const { tokenHash } = await makeCart([{ product: product._id, quantity }], { couponCode: "SAVE10" });
  const { orderNumber } = await placeOrder({ cartTokenHash: tokenHash, contact: contact(), address, safeUseAccepted: true, locale: Locale.EN });
  return { product, orderNumber };
}

describe("transitionOrder", () => {
  it("records each step on the timeline", async () => {
    const { orderNumber } = await placed();
    await transitionOrder({ orderNumber, to: OrderStatus.CONFIRMED });
    const order = await transitionOrder({ orderNumber, to: OrderStatus.OUT_FOR_DELIVERY });
    expect(order.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
    expect(order.timeline.map((entry) => entry.status)).toEqual([
      OrderStatus.PLACED,
      OrderStatus.CONFIRMED,
      OrderStatus.OUT_FOR_DELIVERY,
    ]);
  });

  it("refuses a skipped step", async () => {
    const { orderNumber } = await placed();
    await expect(transitionOrder({ orderNumber, to: OrderStatus.DELIVERED })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("cancelling restores stock, sold count and the coupon", async () => {
    const { product, orderNumber } = await placed(5, 2);
    await transitionOrder({ orderNumber, to: OrderStatus.CANCELLED, note: "customer asked" });
    const after = await ProductModel.findById(product._id).lean();
    expect(after!.stock).toBe(5);
    expect(after!.soldCount).toBe(0);
    expect((await CouponModel.findOne({ code: "SAVE10" }).lean())!.usedCount).toBe(0);
    expect((await OrderModel.findOne({ orderNumber }).lean())!.cancellationReason).toBe("customer asked");
  });

  it("a failed cancellation leaves the order and inventory as they were", async () => {
    const { product, orderNumber } = await placed(5, 2);
    const spy = vi.spyOn(CouponModel, "updateOne").mockRejectedValueOnce(new Error("boom"));
    await expect(transitionOrder({ orderNumber, to: OrderStatus.CANCELLED })).rejects.toThrow("boom");
    spy.mockRestore();
    expect((await OrderModel.findOne({ orderNumber }).lean())!.status).toBe(OrderStatus.PLACED);
    expect((await ProductModel.findById(product._id).lean())!.stock).toBe(3);
  });
});
