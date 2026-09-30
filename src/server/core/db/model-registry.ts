import type { Model } from "mongoose";
import { BrandModel } from "src/server/catalog/brand.schema";
import { CategoryModel } from "src/server/catalog/category.schema";
import { ProductModel } from "src/server/catalog/product.schema";
import { ReviewModel } from "src/server/catalog/review.schema";
import { CartModel } from "src/server/commerce/cart.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { CustomerModel } from "src/server/commerce/customer.schema";
import { OrderSequenceModel } from "src/server/commerce/order-sequence.schema";
import { OrderModel } from "src/server/commerce/order.schema";
import { NewsletterSubscriberModel } from "src/server/content/small-content.schema";
import { AdminRefreshTokenModel } from "src/server/core/auth/admin-refresh-token.schema";
import { IdempotencyRecordModel } from "src/server/core/idempotency/idempotency-record.schema";

/**
 * Every model, listed explicitly. `mongoose.models` only holds what the current
 * route's module graph happened to import, so index verification cannot read
 * it. `model-registry.test.ts` fails when a `createMongoModel` call is missing here.
 */
export const ALL_MODELS = [
  AdminRefreshTokenModel,
  BrandModel,
  CartModel,
  CategoryModel,
  CouponModel,
  CustomerModel,
  IdempotencyRecordModel,
  NewsletterSubscriberModel,
  OrderModel,
  OrderSequenceModel,
  ProductModel,
  ReviewModel,
] as unknown as Model<never>[];
