import {
  Filterable,
  MongoField,
  MongoSchema,
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

@MongoSchema({ timestamps: true })
export class BrandSchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable({ subPaths: ["ar", "en"] })
  @MongoField(localizedStringField())
  name!: LocalizedString;

  @MongoField({ type: localizedSlugSchema, required: true })
  slug!: LocalizedSlug;

  @MongoField(imageAssetField())
  logo?: ImageAsset | null;

  /** Sanitised HTML. */
  @MongoField(localizedStringField())
  description!: LocalizedString;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const BrandModel = createMongoModel(EntityName.BRAND, BrandSchema);

declareIndexOnce(BrandModel, { "slug.ar": 1 }, { unique: true });
declareIndexOnce(BrandModel, { "slug.en": 1 }, { unique: true });
declareIndexOnce(BrandModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });
