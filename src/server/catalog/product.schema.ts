import {
  Filterable,
  MongoField,
  MongoSchema,
  Relation,
  Searchable,
  createMongoModel,
  localizedStringField,
  localizedStringSchema,
  moneyField,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString, Money } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { BadgeTone, EntityName, ProductOptionType } from "src/common/enums";
import { declareIndexOnce } from "src/server/core/db/declare-index-once";
import {
  imageListField,
  imageSchema,
  legacySchema,
  localizedSlugSchema,
  seoSchema,
  type Legacy,
  type LocalizedSlug,
  type Seo,
} from "src/server/core/db/shared-fields";
import { BrandSchema } from "./brand.schema";
import { CategorySchema } from "./category.schema";

const optionValueSchema = new mongoose.Schema({
  label: localizedStringSchema(),
  /** Added to the product price when this value is chosen. Zero is normal. */
  priceDelta: moneyField({ defaultZero: true }),
  image: { type: imageSchema, required: false },
  isAvailable: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const optionGroupSchema = new mongoose.Schema({
  name: localizedStringSchema(),
  type: { type: String, enum: Object.values(ProductOptionType), default: ProductOptionType.TEXT },
  required: { type: Boolean, default: true },
  values: { type: [optionValueSchema], default: () => [] },
});

const badgeSchema = new mongoose.Schema(
  {
    label: localizedStringSchema(),
    tone: { type: String, enum: Object.values(BadgeTone), default: BadgeTone.PRIMARY },
  },
  { _id: false }
);

/** "Add one more for 10% off": the best tier whose minQuantity the line reaches applies. */
const quantityTierSchema = new mongoose.Schema(
  {
    minQuantity: { type: Number, required: true, min: 2 },
    percent: { type: Number, required: true, min: 1, max: 90 },
  },
  { _id: false }
);

export interface ProductOptionValue {
  _id: mongoose.Types.ObjectId;
  label: LocalizedString;
  priceDelta: Money;
  image?: ImageAsset | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ProductOptionGroup {
  _id: mongoose.Types.ObjectId;
  name: LocalizedString;
  type: ProductOptionType;
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductBadge {
  label: LocalizedString;
  tone: BadgeTone;
}

export interface QuantityTier {
  minQuantity: number;
  percent: number;
}

@MongoSchema({ timestamps: true, softDelete: true })
export class ProductSchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable({ subPaths: ["ar", "en"] })
  @MongoField(localizedStringField())
  name!: LocalizedString;

  @MongoField({ type: localizedSlugSchema, required: true })
  slug!: LocalizedSlug;

  /** Sanitised HTML. */
  @MongoField(localizedStringField())
  description!: LocalizedString;

  @Searchable()
  @MongoField({ type: String, trim: true })
  sku?: string;

  @Filterable()
  @Relation(() => BrandSchema)
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.BRAND, default: null })
  brand!: mongoose.Types.ObjectId | null;

  /** Many-to-many: a product appears under every category it belongs to. */
  @Filterable()
  @Relation(() => CategorySchema)
  @MongoField({ type: [mongoose.Schema.Types.ObjectId], ref: EntityName.CATEGORY, default: () => [] })
  categories!: mongoose.Types.ObjectId[];

  /** Drives the breadcrumb and "related" rail. Always one of `categories`. */
  @Relation(() => CategorySchema)
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CATEGORY, default: null })
  primaryCategory!: mongoose.Types.ObjectId | null;

  /** Index 0 is the main image; index 1 is the card's hover image. */
  @MongoField(imageListField())
  images!: ImageAsset[];

  /** The current selling price, VAT inclusive. */
  @MongoField(moneyField({ required: true }))
  price!: Money;

  /** The struck-through "before" price. Only meaningful when greater than `price`. */
  @MongoField(moneyField())
  compareAtPrice?: Money | null;

  /** Drives the countdown on cards and the product page. */
  @MongoField({ type: Date, default: null })
  saleEndsAt?: Date | null;

  @MongoField({ type: Number, default: 0, min: 0 })
  stock!: number;

  /** Off = always purchasable regardless of `stock`. */
  @MongoField({ type: Boolean, default: true })
  trackStock!: boolean;

  /** Display text, e.g. "1 كجم". */
  @MongoField(localizedStringField())
  weight!: LocalizedString;

  @MongoField({ type: [optionGroupSchema], default: () => [] })
  options!: ProductOptionGroup[];

  @MongoField({ type: badgeSchema, default: null })
  badge?: ProductBadge | null;

  @MongoField({ type: [quantityTierSchema], default: () => [] })
  quantityTiers!: QuantityTier[];

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;

  @Filterable()
  @MongoField({ type: Boolean, default: false })
  isFeatured!: boolean;

  /**
   * The rating a product arrived with from the reference store (its aggregate
   * covers reviews that were never embedded in the page). New published reviews
   * combine with it; imported reviews are already inside it.
   */
  @MongoField({
    type: new mongoose.Schema({ average: { type: Number, default: 0 }, count: { type: Number, default: 0 } }, { _id: false }),
    default: () => ({ average: 0, count: 0 }),
  })
  ratingBaseline!: { average: number; count: number };

  @MongoField({ type: Number, default: 0 })
  ratingAverage!: number;

  @MongoField({ type: Number, default: 0 })
  ratingCount!: number;

  /** Real units sold, incremented at placement. Drives "best selling" and the purchase count. */
  @MongoField({ type: Number, default: 0 })
  soldCount!: number;

  /** Admin ordering for "our picks". Lower first. */
  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  /** Arabic-normalised name/sku/brand text for search. Maintained on write. */
  @MongoField({ type: String, default: "", select: false })
  searchText!: string;

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const ProductModel = createMongoModel(EntityName.PRODUCT, ProductSchema);

declareIndexOnce(ProductModel, { "slug.ar": 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
declareIndexOnce(ProductModel, { "slug.en": 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
declareIndexOnce(ProductModel, { sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: "string" } } });
declareIndexOnce(ProductModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });
declareIndexOnce(ProductModel, { isActive: 1, categories: 1 });
declareIndexOnce(ProductModel, { isActive: 1, brand: 1 });
declareIndexOnce(ProductModel, { isActive: 1, soldCount: -1 });
declareIndexOnce(ProductModel, { isActive: 1, ratingAverage: -1 });
declareIndexOnce(ProductModel, { isActive: 1, price: 1 });
