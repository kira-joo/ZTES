import {
  Filterable,
  MongoField,
  MongoSchema,
  Relation,
  Searchable,
  Unique,
  createMongoModel,
} from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName, Locale, OrderStatus, PaymentMethod, TimelineActor } from "src/common/enums";
import { declareIndexOnce } from "src/server/core/db/declare-index-once";
import { CustomerSchema } from "./customer.schema";
import {
  addressSnapshotSchema,
  contactSnapshotSchema,
  couponSnapshotSchema,
  giftSchema,
  orderLineSchema,
  orderPricingSchema,
  safeUseSnapshotSchema,
  type AddressSnapshot,
  type ContactSnapshot,
  type CouponSnapshot,
  type GiftDetails,
  type OrderLineSnapshot,
  type OrderPricing,
  type SafeUseSnapshot,
} from "./order-snapshots";

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    at: { type: Date, required: true },
    actor: { type: String, enum: Object.values(TimelineActor), required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

export interface TimelineEntry {
  status: OrderStatus;
  at: Date;
  actor: TimelineActor;
  note: string;
}

@MongoSchema({ timestamps: true })
export class OrderSchema {
  _id!: mongoose.Types.ObjectId;

  @Unique()
  @Searchable()
  @MongoField({ type: String, required: true })
  orderNumber!: string;

  @Filterable()
  @Relation(() => CustomerSchema)
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CUSTOMER, required: true })
  customer!: mongoose.Types.ObjectId;

  @MongoField({ type: contactSnapshotSchema, required: true })
  contact!: ContactSnapshot;

  @MongoField({ type: addressSnapshotSchema, required: true })
  deliveryAddress!: AddressSnapshot;

  @MongoField({ type: [orderLineSchema], required: true })
  lines!: OrderLineSnapshot[];

  @MongoField({ type: orderPricingSchema, required: true })
  pricing!: OrderPricing;

  @MongoField({ type: couponSnapshotSchema, default: null })
  coupon?: CouponSnapshot | null;

  @MongoField({ type: giftSchema, default: null })
  gift?: GiftDetails | null;

  @MongoField({ type: safeUseSnapshotSchema, required: true })
  safeUse!: SafeUseSnapshot;

  @MongoField({ type: String, enum: Object.values(PaymentMethod), required: true })
  paymentMethod!: PaymentMethod;

  @Filterable()
  @MongoField({ type: String, enum: Object.values(OrderStatus), required: true })
  status!: OrderStatus;

  /** Append-only. */
  @MongoField({ type: [timelineEntrySchema], default: () => [] })
  timeline!: TimelineEntry[];

  /** SHA-256 of the guest's order-page token. The plaintext lives only in their cookie. */
  @MongoField({ type: String, required: true, select: false })
  accessTokenHash!: string;

  @MongoField({ type: String, enum: Object.values(Locale), default: Locale.AR })
  locale!: Locale;

  /** The phone matched one customer while the email belonged to another. For the admin to reconcile. */
  @Filterable()
  @MongoField({ type: Boolean, default: false })
  contactMismatch!: boolean;

  @MongoField({ type: String, default: "", trim: true })
  customerNotes!: string;

  @MongoField({ type: String, default: "" })
  cancellationReason!: string;
}

export const OrderModel = createMongoModel(EntityName.ORDER, OrderSchema);

declareIndexOnce(OrderModel, { status: 1, createdAt: -1 });
declareIndexOnce(OrderModel, { "contact.phone": 1 });
declareIndexOnce(OrderModel, { customer: 1, createdAt: -1 });
