import {
  Filterable,
  MongoField,
  MongoSchema,
  Unique,
  createMongoModel,
  imageAssetField,
  localizedStringField,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName, Locale } from "src/common/enums";

@MongoSchema({ timestamps: true })
export class FaqSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  question!: LocalizedString;

  @MongoField(localizedStringField())
  answer!: LocalizedString;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;
}

export const FaqModel = createMongoModel(EntityName.FAQ, FaqSchema);

@MongoSchema({ timestamps: true })
export class TestimonialSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true, trim: true })
  authorName!: string;

  @MongoField(localizedStringField())
  body!: LocalizedString;

  @MongoField({ type: Number, default: 5, min: 1, max: 5 })
  rating!: number;

  @MongoField(imageAssetField())
  avatar?: ImageAsset | null;

  @MongoField({ type: Number, default: 0 })
  sortOrder!: number;

  @Filterable()
  @MongoField({ type: Boolean, default: true })
  isActive!: boolean;
}

export const TestimonialModel = createMongoModel(EntityName.TESTIMONIAL, TestimonialSchema);

@MongoSchema({ timestamps: true, collection: "newsletter_subscribers" })
export class NewsletterSubscriberSchema {
  _id!: mongoose.Types.ObjectId;

  @Unique({ message: "This email is already subscribed." })
  @MongoField({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @MongoField({ type: String, enum: Object.values(Locale), default: Locale.AR })
  locale!: Locale;
}

export const NewsletterSubscriberModel = createMongoModel(EntityName.NEWSLETTER_SUBSCRIBER, NewsletterSubscriberSchema);
