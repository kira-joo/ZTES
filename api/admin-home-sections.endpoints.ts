import { createCrudEndpoints, MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminPaginationQuery } from "./admin-shared.types";

export type HomeSectionType =
  | "HERO_SLIDER"
  | "TILE_ROW"
  | "BANNER"
  | "BRAND_CAROUSEL"
  | "SPOTLIGHT"
  | "PRODUCT_RAIL"
  | "TRUST_STRIP"
  | "SOCIAL_LINKS"
  | "FAQ"
  | "BLOG_RAIL"
  | "TESTIMONIALS"
  | "BRANCH_MAP";

export type ProductRailSource = "CATEGORY" | "PRODUCTS";

export interface HomeMediaItem {
  _id?: string;
  image?: AdminImageAsset | File | null;
  mobileImage?: AdminImageAsset | File | null;
  title?: LocalizedString;
  subtitle?: LocalizedString;
  href?: string;
}

export interface HomeSectionPayload {
  items?: HomeMediaItem[];
  source?: ProductRailSource;
  category?: string | null;
  products?: string[];
  limit?: number;
  product?: string | null;
  videoUrl?: string;
  couponCode?: string;
  endsAt?: string | null;
  brands?: string[];
}

export interface HomeSectionEntity {
  _id: string;
  type: HomeSectionType;
  title: LocalizedString;
  sortOrder: number;
  isActive: boolean;
  payload: HomeSectionPayload;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSectionFormValues {
  type: HomeSectionType;
  title?: LocalizedString;
  sortOrder?: number;
  isActive?: boolean;
  payload: HomeSectionPayload;
}

export const homeSectionCrudEndpoints = createCrudEndpoints<
  HomeSectionEntity,
  HomeSectionFormValues,
  HomeSectionFormValues,
  AdminPaginationQuery
>({ baseUrl: "/home-sections", updateMethod: MethodType.PUT });

export interface HomeSectionReorderItem {
  id: string;
  sortOrder: number;
}

export const homeSectionReorderEndpoint: Endpoint<{
  body: { items: HomeSectionReorderItem[] };
  returnType: { updated: number };
}> = { url: "/home-sections/order", methodType: MethodType.PUT };
