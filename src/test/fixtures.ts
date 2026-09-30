import { toMoney } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { CouponType } from "src/common/enums";
import { ProductModel } from "src/server/catalog/product.schema";
import { CartModel } from "src/server/commerce/cart.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { StoreSettingsModel } from "src/server/content/store-settings.schema";
import { randomToken, sha256 } from "src/server/core/crypto";

let counter = 0;

export async function seedSettings(overrides: Record<string, unknown> = {}) {
  await StoreSettingsModel.create({
    storeName: { ar: "متجر", en: "Store" },
    delivery: { city: { ar: "الرياض", en: "Riyadh" }, fee: toMoney(9), freeShippingThreshold: toMoney(199), estimate: { ar: "", en: "" } },
    vatRate: 15,
    safeUseText: { ar: "نص", en: "text" },
    ...overrides,
  });
}

export async function makeProduct(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return ProductModel.create({
    name: { ar: `منتج ${counter}`, en: `Product ${counter}` },
    slug: { ar: `منتج-${counter}`, en: `product-${counter}` },
    price: toMoney("50.00"),
    stock: 10,
    trackStock: true,
    isActive: true,
    ...overrides,
  });
}

export async function makeCart(lines: { product: mongoose.Types.ObjectId; quantity: number; optionValueIds?: mongoose.Types.ObjectId[] }[], extra: Record<string, unknown> = {}) {
  const token = randomToken();
  await CartModel.create({
    tokenHash: sha256(token),
    lines: lines.map((line) => ({ optionValueIds: [], ...line })),
    expiresAt: new Date(Date.now() + 86_400_000),
    ...extra,
  });
  return { token, tokenHash: sha256(token) };
}

export async function makeCoupon(overrides: Record<string, unknown> = {}) {
  return CouponModel.create({ code: "SAVE10", type: CouponType.PERCENT, value: toMoney(10), isActive: true, ...overrides });
}

export const contact = (phone = "0563033126", email = "buyer@example.sa") => ({
  firstName: "Sara",
  lastName: "Ali",
  phone,
  email,
});

export const address = { district: "العليا", street: "شارع التحلية", building: "12" };
