import { Filterable, MongoField, MongoSchema, createMongoModel, localizedStringField } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName, HomeSectionType, ProductRailSource } from "src/common/enums";

/** A picture that links somewhere: hero slides, banners, tiles, trust icons. */
export interface HomeMediaItem {
  _id?: string;
  image?: ImageAsset | null;
  mobileImage?: ImageAsset | null;
  title: LocalizedString;
  subtitle: LocalizedString;
  href: string;
}

/**
 * The payload each type carries. Validated per type by the admin DTOs; stored
 * as one mixed field so the admin reorders a single list.
 */
export interface HomeSectionPayload {
  items?: HomeMediaItem[];
  /** PRODUCT_RAIL */
  source?: ProductRailSource;
  category?: string | null;
  products?: string[];
  limit?: number;
  /** SPOTLIGHT */
  product?: string | null;
  videoUrl?: string;
  couponCode?: string;
  endsAt?: string | null;
  /** BRAND_CAROUSEL: empty = every active brand. */
  brands?: string[];
}

@MongoSchema({ timestamps: true, collection: "home_sections" })
export class HomeSectionSchema {
  _id!: mongoose.Types.ObjectId;

  @Filterable()
  @MongoField({ type: String, enum: Object.values(HomeSectionType), required: true })
  type!: HomeSectionType;

  @MongoField(localizedStringField())
  title!: LocalizedString;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;

  @MongoField({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  payload!: HomeSectionPayload;
}

export const HomeSectionModel = createMongoModel(EntityName.HOME_SECTION, HomeSectionSchema);
