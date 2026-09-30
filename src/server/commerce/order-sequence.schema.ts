import { MongoField, MongoSchema, Unique, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";

/** One counter per store-local day. The unique key makes the upsert atomic. */
@MongoSchema({ timestamps: false, collection: "order_sequences" })
export class OrderSequenceSchema {
  _id!: mongoose.Types.ObjectId;

  @Unique()
  @MongoField({ type: String, required: true })
  key!: string;

  @MongoField({ type: Number, required: true, default: 0 })
  value!: number;
}

export const OrderSequenceModel = createMongoModel(EntityName.ORDER_SEQUENCE, OrderSequenceSchema);
