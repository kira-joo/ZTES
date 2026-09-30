import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminLocalizedSlug, AdminPaginationQuery, AdminSeo } from "./admin-shared.types";

export interface BrandEntity {
  _id: string;
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  logo?: AdminImageAsset | null;
  description: LocalizedString;
  sortOrder: number;
  isActive: boolean;
  seo?: AdminSeo;
  createdAt: string;
  updatedAt: string;
}

export interface BrandFormValues {
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  logo?: AdminImageAsset | File | null;
  description: LocalizedString;
  sortOrder: number;
  isActive: boolean;
  seo?: AdminSeo;
}

export interface ListBrandsQuery extends AdminPaginationQuery {
  isActive?: boolean;
}

/** `get` also serves as the endpoint for brand pickers (product's brand select, home section's brand carousel). */
export const brandCrudEndpoints = createCrudEndpoints<BrandEntity, BrandFormValues, BrandFormValues, ListBrandsQuery>({
  baseUrl: "/brands",
  updateMethod: MethodType.PUT,
});
