// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { describe, expect, it, vi } from "vitest";
import { Locale, OrderStatus, PaymentMethod } from "src/common/enums";
import { SAFE_USE_TEXT } from "src/content/store-config";
import { readMoney } from "src/server/core/money";
import { ProductModel } from "src/server/catalog/product.schema";
import { address, contact, makeCart, makeCoupon, makeProduct } from "src/test/fixtures";
import { setupTestDatabase } from "src/test/mongo";
import { CartModel } from "./cart.schema";
import { CouponModel } from "./coupon.schema";
import { CustomerModel } from "./customer.schema";
import { OrderSequenceModel } from "./order-sequence.schema";
import { OrderModel } from "./order.schema";
import { placeOrder } from "./place-order";

setupTestDatabase();

const place = (cartTokenHash: string, overrides: Partial<Parameters<typeof placeOrder>[0]> = {}) =>
  placeOrder({ cartTokenHash, contact: contact(), address, safeUseAccepted: true, locale: Locale.AR, ...overrides });

describe("placeOrder", () => {
  it("commits the order, stock, coupon, customer, sequence and clears the cart", async () => {
    const product = await makeProduct({ price: toMoney("229.00"), stock: 5 });
    await makeCoupon({ code: "SAVE10", usageLimit: 3 });
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 2 }], { couponCode: "SAVE10" });

    const placed = await place(tokenHash, { now: new Date("2026-09-30T09:00:00Z") });

    expect(placed.orderNumber).toBe("260930-0001");
    const order = await OrderModel.findOne({ orderNumber: placed.orderNumber }).select("+accessTokenHash").lean();
    expect(order!.paymentMethod).toBe(PaymentMethod.CASH_ON_DELIVERY);
    expect(order!.status).toBe(OrderStatus.PLACED);
    expect(order!.lines[0]!.name.en).toBe(product.name.en);
    expect(readMoney(order!.pricing.subtotal).toFixed(2)).toBe("458.00");
    expect(readMoney(order!.pricing.couponDiscount).toFixed(2)).toBe("45.80");
    expect(readMoney(order!.pricing.shippingFee).toFixed(2)).toBe("0.00");
    expect(readMoney(order!.pricing.total).toFixed(2)).toBe("412.20");
    expect(order!.contact.phone).toBe("+966563033126");
    expect(order!.accessTokenHash).toHaveLength(64);
    expect(order!.safeUse.text.ar).toBe(SAFE_USE_TEXT.ar);

    expect((await ProductModel.findById(product._id).lean())!.stock).toBe(3);
    expect((await ProductModel.findById(product._id).lean())!.soldCount).toBe(2);
    expect((await CouponModel.findOne({ code: "SAVE10" }).lean())!.usedCount).toBe(1);
    expect(await CustomerModel.countDocuments()).toBe(1);
    expect(await CartModel.countDocuments()).toBe(0);
  });

  it("snapshots: a later catalog edit does not change the order", async () => {
    const product = await makeProduct({ price: toMoney("89.00") });
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 1 }]);
    const { orderNumber } = await place(tokenHash);

    await ProductModel.updateOne({ _id: product._id }, { $set: { price: toMoney("150.00"), "name.en": "Renamed" } });

    const order = await OrderModel.findOne({ orderNumber }).lean();
    expect(readMoney(order!.lines[0]!.unitPrice).toFixed(2)).toBe("89.00");
    expect(order!.lines[0]!.name.en).toBe(product.name.en);
  });

  it("rolls back every collection when a write inside the transaction fails", async () => {
    const product = await makeProduct({ stock: 5 });
    await makeCoupon({ code: "SAVE10" });
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 2 }], { couponCode: "SAVE10" });

    // Fail at the last write, after stock, coupon, customer and sequence were all written.
    const spy = vi.spyOn(OrderModel, "create").mockRejectedValueOnce(new Error("disk full"));
    await expect(place(tokenHash)).rejects.toThrow("disk full");
    spy.mockRestore();

    expect((await ProductModel.findById(product._id).lean())!.stock).toBe(5);
    expect((await ProductModel.findById(product._id).lean())!.soldCount).toBe(0);
    expect((await CouponModel.findOne({ code: "SAVE10" }).lean())!.usedCount).toBe(0);
    expect(await CustomerModel.countDocuments()).toBe(0);
    expect(await OrderSequenceModel.countDocuments()).toBe(0);
    expect(await OrderModel.countDocuments()).toBe(0);
    expect(await CartModel.countDocuments()).toBe(1);
  });

  it("refuses to oversell and leaves the stock untouched", async () => {
    const product = await makeProduct({ stock: 1 });
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 2 }]);
    await expect(place(tokenHash)).rejects.toMatchObject({ statusCode: 409 });
    expect((await ProductModel.findById(product._id).lean())!.stock).toBe(1);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("requires the safe-use acknowledgement and a Saudi mobile", async () => {
    const product = await makeProduct();
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 1 }]);
    await expect(place(tokenHash, { safeUseAccepted: false })).rejects.toMatchObject({ statusCode: 400 });
    await expect(place(tokenHash, { contact: contact("+201001234567") })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("matches returning customers by phone and never overwrites a stored email", async () => {
    const product = await makeProduct();
    const first = await makeCart([{ product: product._id, quantity: 1 }]);
    await place(first.tokenHash, { contact: contact("0563033126", "first@example.sa") });

    const second = await makeCart([{ product: product._id, quantity: 1 }]);
    const { orderNumber } = await place(second.tokenHash, { contact: contact("+966 56 303 3126", "other@example.sa") });

    const customers = await CustomerModel.find().lean();
    expect(customers).toHaveLength(1);
    expect(customers[0]!.email).toBe("first@example.sa");
    expect(customers[0]!.orderCount).toBe(2);
    const order = await OrderModel.findOne({ orderNumber }).lean();
    expect(order!.contactMismatch).toBe(true);
    expect(order!.contact.email).toBe("other@example.sa");
  });

  it("two concurrent first orders from one phone converge on one customer", async () => {
    const product = await makeProduct({ stock: 50 });
    const carts = await Promise.all([1, 2, 3].map(() => makeCart([{ product: product._id, quantity: 1 }])));
    const results = await Promise.allSettled(carts.map((cart) => place(cart.tokenHash)));
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect(await CustomerModel.countDocuments()).toBe(1);
    expect(await OrderModel.countDocuments()).toBe(3);
    const numbers = (await OrderModel.find().lean()).map((order) => order.orderNumber).sort();
    expect(new Set(numbers).size).toBe(3);
  });

  it("rejects an exhausted coupon without placing the order", async () => {
    const product = await makeProduct();
    await makeCoupon({ code: "ONCE", usageLimit: 1, usedCount: 1 });
    const { tokenHash } = await makeCart([{ product: product._id, quantity: 1 }], { couponCode: "ONCE" });
    await expect(place(tokenHash)).rejects.toMatchObject({ statusCode: 409 });
    expect(await OrderModel.countDocuments()).toBe(0);
  });
});
