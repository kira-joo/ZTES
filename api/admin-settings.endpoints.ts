import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminSeo } from "./admin-shared.types";

export interface StoreContact {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: LocalizedString;
}

export interface StoreSocial {
  instagram?: string;
  x?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
  snapchat?: string;
}

export interface StoreLegal {
  vatNumber?: string;
  crNumber?: string;
  vatCertificate?: AdminImageAsset | File | null;
}

export interface StoreAppLinks {
  appStore?: string;
  googlePlay?: string;
}

export interface StoreDelivery {
  city: LocalizedString;
  fee: string;
  freeShippingThreshold?: string | null;
  estimate?: LocalizedString;
}

export interface StoreBranch {
  _id?: string;
  name: LocalizedString;
  address?: LocalizedString;
  hours?: LocalizedString;
  phone?: string;
  mapUrl?: string;
  mapEmbedUrl?: string;
}

export interface StorePopup {
  isActive?: boolean;
  title?: LocalizedString;
  body?: LocalizedString;
  image?: AdminImageAsset | File | null;
  ctaLabel?: LocalizedString;
  ctaHref?: string;
}

export interface StoreSettingsEntity {
  _id: string;
  storeName: LocalizedString;
  tagline?: LocalizedString;
  logo?: AdminImageAsset | null;
  favicon?: AdminImageAsset | null;
  contact: StoreContact;
  social: StoreSocial;
  legal: StoreLegal;
  appLinks: StoreAppLinks;
  announcements: LocalizedString[];
  footerDescription?: LocalizedString;
  delivery: StoreDelivery;
  vatRate: number;
  safeUseTitle?: LocalizedString;
  safeUseText: LocalizedString;
  branches: StoreBranch[];
  searchCategories: string[];
  searchProducts: string[];
  popup: StorePopup;
  seo?: AdminSeo;
}

export type StoreSettingsFormValues = Omit<StoreSettingsEntity, "_id" | "logo" | "favicon" | "legal"> & {
  logo?: AdminImageAsset | File | null;
  favicon?: AdminImageAsset | File | null;
  legal: StoreLegal;
};

export const settingsEndpoint: Endpoint<{ returnType: StoreSettingsEntity }> = { url: "/settings", methodType: MethodType.GET };

export const updateSettingsEndpoint: Endpoint<{ body: StoreSettingsFormValues; returnType: StoreSettingsEntity }> = {
  url: "/settings",
  methodType: MethodType.PUT,
};
