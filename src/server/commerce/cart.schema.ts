import { MongoField, MongoSchema, Unique, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";
import { giftSchema, type GiftDetails } from "./order-snapshots";

/**
 * A guest's cart, found by the token in its httpOnly cookie. Lines carry keys
 * only — never a price — and totals are recomputed on every read, so the cart
 * can never show a price the catalog no longer has.
 */
const cartLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: EntityName.PRODUCT, required: true },
  optionValueIds: { type: [mongoose.Schema.Types.ObjectId], default: () => [] },
  quantity: { type: Number, required: true, min: 1, max: 99 },
});

export interface CartLine {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  optionValueIds: mongoose.Types.ObjectId[];
  quantity: number;
}

@MongoSchema({ timestamps: true })
export class CartSchema {
  _id!: mongoose.Types.ObjectId;

  /** SHA-256 of the cookie value. */
  @Unique()
  @MongoField({ type: String, required: true })
  tokenHash!: string;

  @MongoField({ type: [cartLineSchema], default: () => [] })
  lines!: CartLine[];

  @MongoField({ type: String, default: null, uppercase: true, trim: true })
  couponCode?: string | null;

  @MongoField({ type: giftSchema, default: null })
  gift?: GiftDetails | null;

  /** Abandoned carts expire; every write pushes this forward. */
  @MongoField({ type: Date, required: true, expires: 0 })
  expiresAt!: Date;
}

export const CartModel = createMongoModel(EntityName.CART, CartSchema);
