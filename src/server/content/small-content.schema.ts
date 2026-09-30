/**
 * FAQ and testimonials moved to static content (src/content/*.ts) — see
 * docs/implementation-plan.md's "Scope correction". Only the newsletter
 * subscriber list remains here: user-submitted data, not editorial content.
 */
import { MongoField, MongoSchema, Unique, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName, Locale } from "src/common/enums";

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
