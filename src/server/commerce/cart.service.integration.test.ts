// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieJar } from "src/test/cookie-jar";
import { makeCoupon, makeProduct, seedSettings } from "src/test/fixtures";
import { setupTestDatabase } from "src/test/mongo";
import { CART_COOKIE } from "./storefront-cookies";

vi.mock("next/headers", async () => (await import("src/test/cookie-jar")).mockHeadersModule);

setupTestDatabase();
beforeEach(() => cookieJar.clear());

describe("cart service", () => {
  it("creates the cart on first add, merges identical lines, and re-prices", async () => {
    const { addCartLine, updateCartLine, removeCartLine } = await import("./cart.service");
    await seedSettings();
    const product = await makeProduct({ price: toMoney("100.00") });

    await addCartLine({ productId: String(product._id), optionValueIds: [], quantity: 1 });
    expect(cookieJar.values.get(CART_COOKIE)?.options?.httpOnly).toBe(true);
    const cart = await addCartLine({ productId: String(product._id), optionValueIds: [], quantity: 2 });
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]!.quantity).toBe(3);
    expect(cart.pricing.total).toBe("300.00");

    const updated = await updateCartLine(cart.lines[0]!.lineId, 1);
    expect(updated.pricing.subtotal).toBe("100.00");
    expect(updated.pricing.shippingFee).toBe("9.00");
    expect(updated.pricing.amountToFreeShipping).toBe("99.00");

    expect((await removeCartLine(cart.lines[0]!.lineId)).lines).toEqual([]);
  });

  it("reports a rejected coupon without storing it, and applies a valid one", async () => {
    const { addCartLine, applyCartCoupon, removeCartCoupon } = await import("./cart.service");
    await seedSettings();
    const product = await makeProduct({ price: toMoney("50.00") });
    await makeCoupon({ code: "BIG", minSubtotal: toMoney("500.00") });
    await makeCoupon({ code: "TEN", value: toMoney(10) });
    await addCartLine({ productId: String(product._id), optionValueIds: [], quantity: 1 });

    const rejected = await applyCartCoupon("big");
    expect(rejected).toMatchObject({ applied: false, rejection: "MIN_SUBTOTAL" });
    expect(rejected.cart.coupon).toBeNull();

    expect((await applyCartCoupon("nope")).rejection).toBe("NOT_FOUND");

    const applied = await applyCartCoupon(" ten ");
    expect(applied.applied).toBe(true);
    expect(applied.cart.coupon?.code).toBe("TEN");
    expect(applied.cart.pricing.couponDiscount).toBe("5.00");

    expect((await removeCartCoupon()).coupon).toBeNull();
  });

  it("flags a line whose product went out of stock instead of pricing it", async () => {
    const { addCartLine, buildCartView, currentCart } = await import("./cart.service");
    const { ProductModel } = await import("src/server/catalog/product.schema");
    await seedSettings();
    const product = await makeProduct({ stock: 2 });
    await addCartLine({ productId: String(product._id), optionValueIds: [], quantity: 2 });
    await ProductModel.updateOne({ _id: product._id }, { $set: { stock: 1 } });
    const view = await buildCartView(await currentCart({ create: false }));
    expect(view.lines[0]).toMatchObject({ issue: "INSUFFICIENT_STOCK", available: 1 });
    expect(view.hasIssues).toBe(true);
    expect(view.pricing.total).toBe("0.00");
  });

  it("stores gift details on the cart", async () => {
    const { setCartGift } = await import("./cart.service");
    await seedSettings();
    const view = await setCartGift({ senderName: "A", recipientName: "B", recipientPhone: "+966500000001", message: "hi" });
    expect(view.gift).toMatchObject({ recipientName: "B" });
    expect((await setCartGift(null)).gift).toBeNull();
  });
});
