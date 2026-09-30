import { Filterable, MongoField, MongoSchema, Relation, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";
import { declareIndexOnce } from "src/server/core/db/declare-index-once";
import { legacySchema, type Legacy } from "src/server/core/db/shared-fields";
import { ProductSchema } from "./product.schema";

/**
 * Written by a buyer from their order page (no accounts exist, so the order's
 * access token stands in for "verified purchase"), or imported from the
 * reference. Customer text is shown as written, in whatever language.
 */
@MongoSchema({ timestamps: true })
export class ReviewSchema {
  _id!: mongoose.Types.ObjectId;

  @Filterable()
  @Relation(() => ProductSchema)
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.PRODUCT, required: true })
  product!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true, trim: true })
  authorName!: string;

  @MongoField({ type: Number, required: true, min: 1, max: 5 })
  rating!: number;

  @MongoField({ type: String, default: "", trim: true })
  body!: string;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isPublished!: boolean;

  /** Set when written by a buyer; one review per product per order. */
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.ORDER, default: null })
  order?: mongoose.Types.ObjectId | null;

  /** The original date for imported reviews. */
  @MongoField({ type: Date, default: () => new Date() })
  reviewedAt!: Date;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const ReviewModel = createMongoModel(EntityName.REVIEW, ReviewSchema);

declareIndexOnce(ReviewModel, { product: 1, isPublished: 1, reviewedAt: -1 });
declareIndexOnce(ReviewModel, { order: 1, product: 1 }, { unique: true, partialFilterExpression: { order: { $type: "objectId" } } });
declareIndexOnce(ReviewModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });
