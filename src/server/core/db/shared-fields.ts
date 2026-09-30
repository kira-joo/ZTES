import { imageAssetField, localizedStringField, localizedStringSchema } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";

/** `{ ar, en }` slug. Each side is unique on its own collection (declared per model). */
export const localizedSlugSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

export interface LocalizedSlug {
  ar: string;
  en: string;
}

export const seoSchema = new mongoose.Schema(
  { title: localizedStringSchema(), description: localizedStringSchema() },
  { _id: false }
);

export interface Seo {
  title: LocalizedString;
  description: LocalizedString;
}

/** The id this record had on the reference store. Keys the re-runnable importer. */
export const legacySchema = new mongoose.Schema({ sallaId: { type: String } }, { _id: false });

export interface Legacy {
  sallaId?: string;
}

/** An ordered list of images; index 0 is the primary. */
export function imageListField() {
  return { type: [imageAssetField().type], default: () => [] };
}

export const imageSchema = imageAssetField().type as mongoose.Schema;

/** A localized link target: an internal path or an absolute URL. */
export const linkSchema = new mongoose.Schema(
  { label: localizedStringSchema(), href: { type: String, default: "" } },
  { _id: false }
);

export interface Link {
  label: LocalizedString;
  href: string;
}

export { localizedStringField, localizedStringSchema };
export type { ImageAsset, LocalizedString };
