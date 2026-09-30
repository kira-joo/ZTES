import { localizedStringSchema, moneyField } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString, Money } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { CouponType } from "src/common/enums";

/**
 * Everything the customer was shown and agreed to, copied at placement. An
 * order never re-reads the catalog: a later rename or price change must not
 * rewrite a receipt.
 */
const money = () => moneyField({ required: true });

export const addressSnapshotSchema = new mongoose.Schema(
  {
    city: localizedStringSchema(),
    district: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    building: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    mapUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

export interface AddressSnapshot {
  city: LocalizedString;
  district: string;
  street: string;
  building: string;
  notes: string;
  mapUrl: string;
}

export const contactSnapshotSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

export interface ContactSnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export const selectedOptionSnapshotSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
    group: localizedStringSchema(),
    valueId: { type: mongoose.Schema.Types.ObjectId, required: true },
    value: localizedStringSchema(),
    priceDelta: money(),
  },
  { _id: false }
);

export interface SelectedOptionSnapshot {
  groupId: mongoose.Types.ObjectId;
  group: LocalizedString;
  valueId: mongoose.Types.ObjectId;
  value: LocalizedString;
  priceDelta: Money;
}

export const orderLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: localizedStringSchema(),
    slug: { type: new mongoose.Schema({ ar: String, en: String }, { _id: false }) },
    sku: { type: String },
    imageUrl: { type: String },
    selectedOptions: { type: [selectedOptionSnapshotSchema], default: () => [] },
    /** Price plus option deltas, before any quantity discount. */
    unitPrice: money(),
    compareAtPrice: moneyField(),
    quantity: { type: Number, required: true, min: 1 },
    /** unitPrice × quantity. */
    lineGross: money(),
    /** The quantity-tier percent applied, 0 when none. */
    tierPercent: { type: Number, default: 0 },
    tierDiscount: money(),
    /** lineGross − tierDiscount. Stored so a receipt never depends on re-running pricing. */
    lineTotal: money(),
  },
  { _id: false }
);

export interface OrderLineSnapshot {
  product: mongoose.Types.ObjectId;
  name: LocalizedString;
  slug: { ar: string; en: string };
  sku?: string;
  imageUrl?: string;
  selectedOptions: SelectedOptionSnapshot[];
  unitPrice: Money;
  compareAtPrice?: Money | null;
  quantity: number;
  lineGross: Money;
  tierPercent: number;
  tierDiscount: Money;
  lineTotal: Money;
}

export const orderPricingSchema = new mongoose.Schema(
  {
    /** Σ lineTotal. */
    subtotal: money(),
    /** Coupon discount, stored positive. */
    couponDiscount: money(),
    shippingFee: money(),
    total: money(),
    /** The VAT already inside `total` (prices are VAT inclusive). */
    vatIncluded: money(),
    vatRate: { type: Number, required: true },
  },
  { _id: false }
);

export interface OrderPricing {
  subtotal: Money;
  couponDiscount: Money;
  shippingFee: Money;
  total: Money;
  vatIncluded: Money;
  vatRate: number;
}

export const couponSnapshotSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: Object.values(CouponType), required: true },
    value: money(),
    freeShipping: { type: Boolean, default: false },
  },
  { _id: false }
);

export interface CouponSnapshot {
  coupon: mongoose.Types.ObjectId;
  code: string;
  type: CouponType;
  value: Money;
  freeShipping: boolean;
}

/** "Send as a gift": delivered to the recipient, in Riyadh like every order. */
export const giftSchema = new mongoose.Schema(
  {
    senderName: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    recipientPhone: { type: String, required: true },
    message: { type: String, trim: true, default: "" },
    deliverOn: { type: Date, default: null },
  },
  { _id: false }
);

export interface GiftDetails {
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  deliverOn?: Date | null;
}

/** The exact safe-use wording the customer accepted, and when. */
export const safeUseSnapshotSchema = new mongoose.Schema(
  { text: localizedStringSchema(), acceptedAt: { type: Date, required: true } },
  { _id: false }
);

export interface SafeUseSnapshot {
  text: LocalizedString;
  acceptedAt: Date;
}
