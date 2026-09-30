import { BadRequestError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { resolveSession } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { readMoney, readOptionalMoney } from "src/server/core/money";
import { DELIVERY_FEE, FREE_SHIPPING_THRESHOLD, VAT_RATE } from "src/content/store-config";
import { CouponModel, type CouponSchema } from "src/server/commerce/coupon.schema";
import { randomToken, sha256 } from "src/server/core/crypto";
import { CouponRejection, evaluateCoupon } from "src/server/engines/coupon";
import { calculatePricing, type PricingResult } from "src/server/engines/pricing";
import { CartModel, type CartSchema } from "./cart.schema";
import type { GiftDetails } from "./order-snapshots";
import type { CartLineView, CartView } from "src/common/types/cart";
import { resolveLines, type ResolvedLine } from "./resolve-lines";
import { readCartToken, writeCartToken } from "./storefront-cookies";

const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LINES = 50;
const MAX_QUANTITY = 99;

type LeanCart = CartSchema;

const fixed = (value: { toFixed: (n: number) => string }) => value.toFixed(2);

function lineRequests(cart: LeanCart) {
  return cart.lines.map((line) => ({
    lineId: String(line._id),
    productId: String(line.product),
    optionValueIds: line.optionValueIds.map(String),
    quantity: line.quantity,
  }));
}

export interface PricedCart {
  cart: LeanCart;
  lines: ResolvedLine[];
  coupon: CouponSchema | null;
  couponRejection: CouponRejection | null;
  pricing: PricingResult;
}

/** Prices a cart from the live catalog, settings and coupon. Shared with placement. */
export async function priceCart(cart: LeanCart, now = new Date()): Promise<PricedCart> {
  const lines = await resolveLines(lineRequests(cart));
  const purchasable = lines.filter((line) => line.issue === null);

  const base = {
    lines: purchasable.map((line) => ({
      key: line.lineId,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      tiers: line.tiers,
    })),
    shippingFee: DELIVERY_FEE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    vatRate: VAT_RATE,
  };

  let coupon: CouponSchema | null = null;
  let couponRejection: CouponRejection | null = null;

  if (cart.couponCode) {
    coupon = await CouponModel.findOne({ code: cart.couponCode })
      .session(resolveSession() ?? null)
      .lean<CouponSchema>();
    const subtotal = calculatePricing(base).subtotal;
    const verdict = evaluateCoupon(
      coupon ? { ...coupon, minSubtotal: readOptionalMoney(coupon.minSubtotal) } : null,
      subtotal,
      now
    );
    if (!verdict.ok) couponRejection = verdict.reason;
  }

  const pricing = calculatePricing({
    ...base,
    coupon:
      coupon && !couponRejection
        ? { type: coupon.type, value: readMoney(coupon.value), maxDiscount: readOptionalMoney(coupon.maxDiscount), freeShipping: coupon.freeShipping }
        : null,
  });

  return { cart, lines, coupon, couponRejection, pricing };
}

export function toCartView(priced: PricedCart, freeShippingThreshold: string | null): CartView {
  const pricedByKey = new Map(priced.pricing.lines.map((line) => [line.key, line]));

  const lines: CartLineView[] = priced.lines.map((line) => {
    const pricedLine = pricedByKey.get(line.lineId);
    const product = line.product;
    return {
      lineId: line.lineId,
      productId: line.productId,
      name: product?.name ?? { ar: "", en: "" },
      slug: product?.slug ?? { ar: "", en: "" },
      imageUrl: product?.images?.[0]?.secureUrl ?? null,
      weight: product?.weight ?? null,
      options: line.options.map((option) => ({ group: option.group, value: option.value })),
      unitPrice: fixed(line.unitPrice),
      compareAtPrice: product?.compareAtPrice ? fixed(readMoney(product.compareAtPrice)) : null,
      quantity: line.quantity,
      lineGross: pricedLine ? fixed(pricedLine.lineGross) : fixed(line.unitPrice.mul(line.quantity)),
      tierPercent: pricedLine?.tierPercent ?? 0,
      tierDiscount: pricedLine ? fixed(pricedLine.tierDiscount) : "0.00",
      lineTotal: pricedLine ? fixed(pricedLine.lineTotal) : fixed(line.unitPrice.mul(line.quantity)),
      nextTier: pricedLine?.nextTier ?? null,
      issue: line.issue,
      ...(line.available !== undefined ? { available: line.available } : {}),
    };
  });

  const p = priced.pricing;
  return {
    lines,
    itemCount: lines.reduce((acc, line) => acc + line.quantity, 0),
    coupon: priced.cart.couponCode
      ? {
          code: priced.cart.couponCode,
          description: priced.coupon?.description ?? { ar: "", en: "" },
          valid: priced.couponRejection === null,
          rejection: priced.couponRejection,
        }
      : null,
    gift: priced.cart.gift ?? null,
    pricing: {
      subtotal: fixed(p.subtotal),
      couponDiscount: fixed(p.couponDiscount),
      shippingFee: fixed(p.shippingFee),
      total: fixed(p.total),
      vatIncluded: fixed(p.vatIncluded),
      totalBeforeVat: fixed(p.totalBeforeVat),
      vatRate: p.vatRate,
      amountToFreeShipping: p.amountToFreeShipping ? fixed(p.amountToFreeShipping) : null,
      freeShippingThreshold,
      freeShippingApplied: p.freeShippingApplied,
    },
    hasIssues: lines.some((line) => line.issue !== null),
  };
}

export async function findCartByToken(token: string | undefined): Promise<LeanCart | null> {
  if (!token) return null;
  return CartModel.findOne({ tokenHash: sha256(token) }).lean<LeanCart>();
}

/** The current request's cart, created (and its cookie set) when `create` is true. */
export async function currentCart(options: { create: boolean }): Promise<LeanCart | null> {
  const token = await readCartToken();
  const existing = await findCartByToken(token);
  if (existing || !options.create) return existing;

  const fresh = randomToken();
  const created = await CartModel.create({ tokenHash: sha256(fresh), lines: [], expiresAt: new Date(Date.now() + CART_TTL_MS) });
  await writeCartToken(fresh);
  return created.toObject() as LeanCart;
}

export async function buildCartView(cart: LeanCart | null): Promise<CartView> {
  const threshold = FREE_SHIPPING_THRESHOLD.toFixed(2);
  const empty: LeanCart = cart ?? ({ lines: [], couponCode: null, gift: null } as unknown as LeanCart);
  return toCartView(await priceCart(empty), threshold);
}

async function saveLines(cartId: mongoose.Types.ObjectId, update: mongoose.UpdateQuery<CartSchema>) {
  await CartModel.updateOne(
    { _id: cartId },
    { ...update, $set: { ...(update.$set ?? {}), expiresAt: new Date(Date.now() + CART_TTL_MS) } }
  );
}

function sameOptions(a: readonly unknown[], b: readonly unknown[]): boolean {
  const left = a.map(String).sort();
  const right = b.map(String).sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function addCartLine(input: { productId: string; optionValueIds: string[]; quantity: number }) {
  const cart = (await currentCart({ create: true }))!;
  const existing = cart.lines.find(
    (line) => String(line.product) === input.productId && sameOptions(line.optionValueIds, input.optionValueIds)
  );

  if (existing) {
    const quantity = Math.min(MAX_QUANTITY, existing.quantity + input.quantity);
    await CartModel.updateOne({ _id: cart._id, "lines._id": existing._id }, { $set: { "lines.$.quantity": quantity } });
  } else {
    if (cart.lines.length >= MAX_LINES) throw new BadRequestError("Your cart is full.");
    await saveLines(cart._id, {
      $push: {
        lines: {
          product: new mongoose.Types.ObjectId(input.productId),
          optionValueIds: input.optionValueIds.map((id) => new mongoose.Types.ObjectId(id)),
          quantity: Math.min(MAX_QUANTITY, input.quantity),
        },
      },
    });
  }
  return buildCartView(await findCartById(cart._id));
}

async function findCartById(id: mongoose.Types.ObjectId) {
  return CartModel.findById(id).lean<LeanCart>();
}

async function requireCart(): Promise<LeanCart> {
  const cart = await currentCart({ create: false });
  if (!cart) throw new NotFoundError("Cart not found.");
  return cart;
}

export async function updateCartLine(lineId: string, quantity: number) {
  const cart = await requireCart();
  const result = await CartModel.updateOne(
    { _id: cart._id, "lines._id": lineId },
    { $set: { "lines.$.quantity": Math.min(MAX_QUANTITY, quantity), expiresAt: new Date(Date.now() + CART_TTL_MS) } }
  );
  if (result.matchedCount === 0) throw new NotFoundError("Cart line not found.");
  return buildCartView(await findCartById(cart._id));
}

export async function removeCartLine(lineId: string) {
  const cart = await requireCart();
  await saveLines(cart._id, { $pull: { lines: { _id: new mongoose.Types.ObjectId(lineId) } } });
  return buildCartView(await findCartById(cart._id));
}

/** Applies a code. An unknown or ineligible code is reported in the view, not stored. */
export async function applyCartCoupon(code: string) {
  const cart = (await currentCart({ create: true }))!;
  const normalized = code.trim().toUpperCase();
  const probe = await priceCart({ ...cart, couponCode: normalized });
  if (probe.couponRejection) {
    return { applied: false as const, rejection: probe.couponRejection, cart: await buildCartView(cart) };
  }
  await saveLines(cart._id, { $set: { couponCode: normalized } });
  return { applied: true as const, rejection: null, cart: await buildCartView(await findCartById(cart._id)) };
}

export async function removeCartCoupon() {
  const cart = await requireCart();
  await saveLines(cart._id, { $set: { couponCode: null } });
  return buildCartView(await findCartById(cart._id));
}

export async function setCartGift(gift: GiftDetails | null) {
  const cart = (await currentCart({ create: true }))!;
  await saveLines(cart._id, { $set: { gift } });
  return buildCartView(await findCartById(cart._id));
}
