import {
  MongoField,
  MongoSchema,
  createMongoModel,
  imageAssetField,
  localizedStringField,
  localizedStringSchema,
  moneyField,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString, Money } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";
import { imageSchema, seoSchema, type Seo } from "src/server/core/db/shared-fields";

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    address: localizedStringSchema(),
  },
  { _id: false }
);

const socialSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: "" },
    x: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    facebook: { type: String, default: "" },
    youtube: { type: String, default: "" },
    snapchat: { type: String, default: "" },
  },
  { _id: false }
);

const legalSchema = new mongoose.Schema(
  {
    vatNumber: { type: String, default: "" },
    crNumber: { type: String, default: "" },
    vatCertificate: { type: imageSchema, default: null },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    /** The single delivery area. Riyadh at launch. */
    city: localizedStringSchema(),
    fee: moneyField({ defaultZero: true }),
    /** Orders at or above this are delivered free. Null = never free. */
    freeShippingThreshold: moneyField(),
    estimate: localizedStringSchema(),
  },
  { _id: false }
);

const branchSchema = new mongoose.Schema({
  name: localizedStringSchema(),
  address: localizedStringSchema(),
  hours: localizedStringSchema(),
  phone: { type: String, default: "" },
  mapUrl: { type: String, default: "" },
  mapEmbedUrl: { type: String, default: "" },
});

const popupSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    title: localizedStringSchema(),
    body: localizedStringSchema(),
    image: { type: imageSchema, default: null },
    ctaLabel: localizedStringSchema(),
    ctaHref: { type: String, default: "" },
  },
  { _id: false }
);

const appLinksSchema = new mongoose.Schema(
  { appStore: { type: String, default: "" }, googlePlay: { type: String, default: "" } },
  { _id: false }
);

export interface Branch {
  _id: mongoose.Types.ObjectId;
  name: LocalizedString;
  address: LocalizedString;
  hours: LocalizedString;
  phone: string;
  mapUrl: string;
  mapEmbedUrl: string;
}

/** One document. Everything that makes the store *this* store is data here. */
@MongoSchema({ timestamps: true, collection: "store_settings" })
export class StoreSettingsSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  storeName!: LocalizedString;

  @MongoField(localizedStringField())
  tagline!: LocalizedString;

  @MongoField(imageAssetField())
  logo?: ImageAsset | null;

  @MongoField(imageAssetField())
  favicon?: ImageAsset | null;

  @MongoField({ type: contactSchema, default: () => ({}) })
  contact!: { phone: string; whatsapp: string; email: string; address: LocalizedString };

  @MongoField({ type: socialSchema, default: () => ({}) })
  social!: Record<"instagram" | "x" | "tiktok" | "facebook" | "youtube" | "snapchat", string>;

  @MongoField({ type: legalSchema, default: () => ({}) })
  legal!: { vatNumber: string; crNumber: string; vatCertificate?: ImageAsset | null };

  @MongoField({ type: appLinksSchema, default: () => ({}) })
  appLinks!: { appStore: string; googlePlay: string };

  /** The scrolling announcement bar. */
  @MongoField({ type: [localizedStringSchema()], default: () => [] })
  announcements!: LocalizedString[];

  @MongoField(localizedStringField())
  footerDescription!: LocalizedString;

  @MongoField({ type: deliverySchema, default: () => ({}) })
  delivery!: { city: LocalizedString; fee: Money; freeShippingThreshold?: Money | null; estimate: LocalizedString };

  /** Prices are VAT inclusive; this splits the VAT out for display and the receipt. */
  @MongoField({ type: Number, default: 15, min: 0, max: 100 })
  vatRate!: number;

  /** The acknowledgement a customer must accept before checkout. */
  @MongoField(localizedStringField())
  safeUseTitle!: LocalizedString;

  @MongoField(localizedStringField())
  safeUseText!: LocalizedString;

  @MongoField({ type: [branchSchema], default: () => [] })
  branches!: Branch[];

  /** The search modal's zero-query state. */
  @MongoField({ type: [mongoose.Schema.Types.ObjectId], ref: EntityName.CATEGORY, default: () => [] })
  searchCategories!: mongoose.Types.ObjectId[];

  @MongoField({ type: [mongoose.Schema.Types.ObjectId], ref: EntityName.PRODUCT, default: () => [] })
  searchProducts!: mongoose.Types.ObjectId[];

  @MongoField({ type: popupSchema, default: () => ({}) })
  popup!: {
    isActive: boolean;
    title: LocalizedString;
    body: LocalizedString;
    image?: ImageAsset | null;
    ctaLabel: LocalizedString;
    ctaHref: string;
  };

  @MongoField({ type: seoSchema, default: () => ({}) })
  seo!: Seo;
}

export const StoreSettingsModel = createMongoModel(EntityName.STORE_SETTINGS, StoreSettingsSchema);
