import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminLocalizedSlug, AdminPaginationQuery, AdminSeo } from "./admin-shared.types";

export interface PostEntity {
  _id: string;
  title: LocalizedString;
  slug: AdminLocalizedSlug;
  excerpt: LocalizedString;
  body: LocalizedString;
  cover?: AdminImageAsset | null;
  isPublished: boolean;
  publishedAt: string;
  seo?: AdminSeo;
  createdAt: string;
  updatedAt: string;
}

export interface PostFormValues {
  title: LocalizedString;
  slug: AdminLocalizedSlug;
  excerpt?: LocalizedString;
  body: LocalizedString;
  cover?: AdminImageAsset | File | null;
  isPublished?: boolean;
  publishedAt?: string;
  seo?: AdminSeo;
}

export const postCrudEndpoints = createCrudEndpoints<PostEntity, PostFormValues, PostFormValues, AdminPaginationQuery>({
  baseUrl: "/posts",
  updateMethod: MethodType.PUT,
});
