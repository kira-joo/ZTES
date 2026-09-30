import {
  Filterable,
  MongoField,
  MongoSchema,
  Searchable,
  Unique,
  createMongoModel,
  localizedStringField,
  moneyField,
} from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString, Money } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { CouponType, EntityName } from "src/common/enums";

@MongoSchema({ timestamps: true })
export class CouponSchema {
  _id!: mongoose.Types.ObjectId;

  @Unique({ message: "A coupon with this code already exists." })
  @Searchable()
  @MongoField({ type: String, required: true, uppercase: true, trim: true })
  code!: string;

  /** Shown to the customer when applied, and on the product page's copy-code box. */
  @MongoField(localizedStringField())
  description!: LocalizedString;

  @MongoField({ type: String, enum: Object.values(CouponType), required: true })
  type!: CouponType;

  /** PERCENT: 1–100. FIXED: an amount. */
  @MongoField(moneyField({ required: true }))
  value!: Money;

  @MongoField(moneyField())
  minSubtotal?: Money | null;

  /** PERCENT only: a ceiling on the discount. */
  @MongoField(moneyField())
  maxDiscount?: Money | null;

  @MongoField({ type: Boolean, default: false })
  freeShipping!: boolean;

  @MongoField({ type: Date, default: null })
  startsAt?: Date | null;

  @MongoField({ type: Date, default: null })
  endsAt?: Date | null;

  /** Total redemptions allowed; null = unlimited. */
  @MongoField({ type: Number, default: null })
  usageLimit?: number | null;

  /** Incremented inside the placement transaction. */
  @MongoField({ type: Number, default: 0 })
  usedCount!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;
}

export const CouponModel = createMongoModel(EntityName.COUPON, CouponSchema);
