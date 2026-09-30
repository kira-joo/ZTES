import { BadRequestError, ConflictError } from "@kira-joo/backend-toolkit-core";
import { withTransaction } from "@kira-joo/backend-toolkit-mongoose";
import { readMoney, readOptionalMoney } from "src/server/core/money";
import mongoose from "mongoose";
import { Locale, OrderStatus, PaymentMethod, TimelineActor } from "src/common/enums";
import { ProductModel } from "src/server/catalog/product.schema";
import { getSettingsDocument } from "src/server/content/settings.service";
import { randomToken, sha256 } from "src/server/core/crypto";
import { decideCustomerMatch } from "src/server/engines/customer-match";
import { normalizeEmail, normalizeSaudiMobile } from "src/server/engines/normalize";
import { formatOrderNumber, orderDayKey } from "src/server/engines/order-number";
import { CartModel, type CartSchema } from "./cart.schema";
import { priceCart } from "./cart.service";
import { CouponModel } from "./coupon.schema";
import { CustomerModel } from "./customer.schema";
import { OrderSequenceModel } from "./order-sequence.schema";
import { OrderModel } from "./order.schema";
import type { AddressSnapshot, OrderLineSnapshot } from "./order-snapshots";

export interface PlaceOrderInput {
  cartTokenHash: string;
  contact: { firstName: string; lastName: string; phone: string; email: string };
  address: { district: string; street: string; building?: string; notes?: string; mapUrl?: string };
  customerNotes?: string;
  safeUseAccepted: boolean;
  locale: Locale;
  now?: Date;
}

export interface PlacedOrder {
  orderNumber: string;
  /** Plaintext; the route puts it in an httpOnly cookie. Only its hash is stored. */
  accessToken: string;
}

/**
 * Places a cash-on-delivery order as ONE transaction: re-price from the live
 * catalog, decrement stock, redeem the coupon, match or create the customer,
 * allocate the order number, snapshot everything, clear the cart. Any failure
 * leaves no collection changed.
 *
 * No external I/O happens inside — the callback re-runs on a transient
 * conflict. Every raw model call passes the session explicitly.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  if (!input.safeUseAccepted) {
    throw new BadRequestError("The safe-use acknowledgement must be accepted.", { reason: "SAFE_USE_REQUIRED" });
  }
  const phone = normalizeSaudiMobile(input.contact.phone);
  if (!phone) throw new BadRequestError("A Saudi mobile number is required.", { reason: "INVALID_PHONE" });
  const email = normalizeEmail(input.contact.email);
  const now = input.now ?? new Date();

  return withTransaction(async (tx) => {
    const session = tx.session;

    const cart = await CartModel.findOne({ tokenHash: input.cartTokenHash }).session(session).lean<CartSchema>();
    if (!cart || cart.lines.length === 0) throw new ConflictError("Your cart is empty.", { reason: "EMPTY_CART" });

    const settings = await getSettingsDocument();
    const priced = await priceCart(cart, now);

    const issues = priced.lines.filter((line) => line.issue !== null);
    if (issues.length > 0) {
      throw new ConflictError("Some items in your cart changed.", {
        reason: "CART_CHANGED",
        issues: issues.map((line) => ({ lineId: line.lineId, issue: line.issue, available: line.available })),
      });
    }
    if (priced.couponRejection) {
      throw new ConflictError("The coupon can no longer be applied.", {
        reason: "COUPON_REJECTED",
        rejection: priced.couponRejection,
      });
    }

    // Stock: one conditional decrement per product, so a race cannot oversell.
    const quantities = new Map<string, number>();
    for (const line of priced.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);

    for (const [productId, quantity] of quantities) {
      const product = priced.lines.find((line) => line.productId === productId)!.product!;
      const filter = product.trackStock
        ? { _id: product._id, stock: { $gte: quantity } }
        : { _id: product._id };
      const update = product.trackStock
        ? { $inc: { stock: -quantity, soldCount: quantity } }
        : { $inc: { soldCount: quantity } };
      const result = await ProductModel.updateOne(filter, update, { session });
      if (result.modifiedCount !== 1) {
        throw new ConflictError("An item just sold out.", { reason: "CART_CHANGED", issues: [{ productId, issue: "OUT_OF_STOCK" }] });
      }
    }

    if (priced.coupon) {
      const limit = priced.coupon.usageLimit;
      const result = await CouponModel.updateOne(
        limit != null ? { _id: priced.coupon._id, usedCount: { $lt: limit } } : { _id: priced.coupon._id },
        { $inc: { usedCount: 1 } },
        { session }
      );
      if (result.modifiedCount !== 1) {
        throw new ConflictError("The coupon can no longer be applied.", { reason: "COUPON_REJECTED", rejection: "USAGE_LIMIT" });
      }
    }

    const address: AddressSnapshot = {
      city: settings.delivery?.city ?? { ar: "الرياض", en: "Riyadh" },
      district: input.address.district.trim(),
      street: input.address.street.trim(),
      building: input.address.building?.trim() ?? "",
      notes: input.address.notes?.trim() ?? "",
      mapUrl: input.address.mapUrl?.trim() ?? "",
    };

    const [byPhone, byEmail] = await Promise.all([
      CustomerModel.findOne({ phone }).session(session).lean(),
      CustomerModel.findOne({ email }).session(session).lean(),
    ]);
    const decision = decideCustomerMatch({
      phone,
      email,
      byPhone: byPhone ? { id: String(byPhone._id), phone: byPhone.phone, email: byPhone.email } : null,
      byEmail: byEmail ? { id: String(byEmail._id), phone: byEmail.phone, email: byEmail.email } : null,
    });

    let customerId: mongoose.Types.ObjectId;
    const identityRefresh = {
      firstName: input.contact.firstName.trim(),
      lastName: input.contact.lastName.trim(),
      lastAddress: address,
      lastOrderAt: now,
    };
    if (decision.action === "create") {
      const [created] = await CustomerModel.create([{ ...identityRefresh, phone, email, orderCount: 1 }], { session });
      customerId = created!._id;
    } else {
      customerId = new mongoose.Types.ObjectId(decision.customerId);
      await CustomerModel.updateOne({ _id: customerId }, { $set: identityRefresh, $inc: { orderCount: 1 } }, { session });
    }

    const dayKey = orderDayKey(now);
    const sequence = await OrderSequenceModel.findOneAndUpdate(
      { key: dayKey },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after", session }
    ).lean();
    const orderNumber = formatOrderNumber(sequence!.value, dayKey);

    const pricedByKey = new Map(priced.pricing.lines.map((line) => [line.key, line]));
    const lines: OrderLineSnapshot[] = priced.lines.map((line) => {
      const p = pricedByKey.get(line.lineId)!;
      const product = line.product!;
      return {
        product: product._id,
        name: product.name,
        slug: product.slug,
        ...(product.sku ? { sku: product.sku } : {}),
        ...(product.images?.[0]?.secureUrl ? { imageUrl: product.images[0].secureUrl } : {}),
        selectedOptions: line.options,
        unitPrice: p.unitPrice,
        compareAtPrice: readOptionalMoney(product.compareAtPrice),
        quantity: p.quantity,
        lineGross: p.lineGross,
        tierPercent: p.tierPercent,
        tierDiscount: p.tierDiscount,
        lineTotal: p.lineTotal,
      };
    });

    const accessToken = randomToken();
    const pricing = priced.pricing;

    await OrderModel.create(
      [
        {
          orderNumber,
          customer: customerId,
          contact: { firstName: identityRefresh.firstName, lastName: identityRefresh.lastName, phone, email },
          deliveryAddress: address,
          lines,
          pricing: {
            subtotal: pricing.subtotal,
            couponDiscount: pricing.couponDiscount,
            shippingFee: pricing.shippingFee,
            total: pricing.total,
            vatIncluded: pricing.vatIncluded,
            vatRate: pricing.vatRate,
          },
          coupon: priced.coupon
            ? {
                coupon: priced.coupon._id,
                code: priced.coupon.code,
                type: priced.coupon.type,
                value: readMoney(priced.coupon.value),
                freeShipping: priced.coupon.freeShipping,
              }
            : null,
          gift: cart.gift ?? null,
          safeUse: {
            text: settings.safeUseText ?? { ar: "", en: "" },
            acceptedAt: now,
          },
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          status: OrderStatus.PLACED,
          timeline: [{ status: OrderStatus.PLACED, at: now, actor: TimelineActor.CUSTOMER, note: "" }],
          accessTokenHash: sha256(accessToken),
          locale: input.locale,
          contactMismatch: decision.action === "attach" ? decision.contactMismatch : false,
          customerNotes: input.customerNotes?.trim() ?? "",
        },
      ],
      { session }
    );

    await CartModel.deleteOne({ _id: cart._id }, { session });

    return tx.complete({ orderNumber, accessToken });
  });
}
