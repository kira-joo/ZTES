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
export class PageSchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable({ subPaths: ["ar", "en"] })
  @MongoField(localizedStringField())
  title!: LocalizedString;

  @MongoField({ type: localizedSlugSchema, required: true })
  slug!: LocalizedSlug;

  /** Sanitised HTML. */
  @MongoField(localizedStringField())
  body!: LocalizedString;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;

  @MongoField({ type: Boolean, default: true })
  showInFooter!: boolean;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const PageModel = createMongoModel(EntityName.PAGE, PageSchema);
declareIndexOnce(PageModel, { "slug.ar": 1 }, { unique: true });
declareIndexOnce(PageModel, { "slug.en": 1 }, { unique: true });
declareIndexOnce(PageModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });

/** The "Pest Library" blog. A post whose English body is empty is Arabic-only. */
@MongoSchema({ timestamps: true })
export class PostSchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable({ subPaths: ["ar", "en"] })
  @MongoField(localizedStringField())
  title!: LocalizedString;

  @MongoField({ type: localizedSlugSchema, required: true })
  slug!: LocalizedSlug;

  @MongoField(localizedStringField())
  excerpt!: LocalizedString;

  /** Sanitised HTML. */
  @MongoField(localizedStringField())
  body!: LocalizedString;

  @MongoField(imageAssetField())
  cover?: ImageAsset | null;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isPublished!: boolean;

  @MongoField({ type: Date, default: () => new Date() })
  publishedAt!: Date;

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;

  @MongoField({ type: legacySchema, default: () => ({}) })
  legacy!: Legacy;
}

export const PostModel = createMongoModel(EntityName.POST, PostSchema);
declareIndexOnce(PostModel, { "slug.ar": 1 }, { unique: true });
declareIndexOnce(PostModel, { "slug.en": 1 }, { unique: true });
declareIndexOnce(PostModel, { isPublished: 1, publishedAt: -1 });
declareIndexOnce(PostModel, { "legacy.sallaId": 1 }, { unique: true, sparse: true });
