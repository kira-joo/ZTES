import {
  Filterable,
  MongoField,
  MongoSchema,
  Relation,
  Searchable,
  createMongoModel,
  imageAssetField,
  localizedStringField,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";
import { declareIndexOnce } from "src/server/core/db/declare-index-once";
import {
  legacySchema,
  localizedSlugSchema,
  seoSchema,
  type Legacy,
  type LocalizedSlug,
  type Seo,
} from "src/server/core/db/shared-fields";

/** Up to three levels (the reference menu's depth). Depth is enforced on write, not here. */
@MongoSchema({ timestamps: true })
export class CategorySchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable({ subPaths: ["ar", "en"] })
  @MongoField(localizedStringField())
  name!: LocalizedString;

  @MongoField({ type: localizedSlugSchema, required: true })
  slug!: LocalizedSlug;

  @MongoField(localizedStringField())
  description!: LocalizedString;

  @Filterable()
  @Relation(() => CategorySchema)
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CATEGORY, default: null })
  parent!: mongoose.Types.ObjectId | null;

  @MongoField(imageAssetField())
  image?: ImageAsset | null;

  /** The small menu icon the reference shows beside each entry. */
  @MongoField(imageAssetField())
  icon?: ImageAsset | null;

  @MongoField(imageAssetField())
  banner?: ImageAsset | null;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;

  @MongoField({ type: Boolean, default: true })
  showInMenu!: boolean;

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const CategoryModel = createMongoModel(EntityName.CATEGORY, CategorySchema);

declareIndexOnce(CategoryModel, { "slug.ar": 1 }, { unique: true });
declareIndexOnce(CategoryModel, { "slug.en": 1 }, { unique: true });
declareIndexOnce(CategoryModel, { parent: 1, sortOrder: 1 });
declareIndexOnce(CategoryModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });
