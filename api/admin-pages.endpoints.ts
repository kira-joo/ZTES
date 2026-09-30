import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminLocalizedSlug, AdminPaginationQuery, AdminSeo } from "./admin-shared.types";

export interface PageEntity {
  _id: string;
  title: LocalizedString;
  slug: AdminLocalizedSlug;
  body: LocalizedString;
  isActive: boolean;
  showInFooter: boolean;
  sortOrder: number;
  seo?: AdminSeo;
  createdAt: string;
  updatedAt: string;
}

export interface PageFormValues {
  title: LocalizedString;
  slug: AdminLocalizedSlug;
  body: LocalizedString;
  isActive?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
  seo?: AdminSeo;
}

export const pageCrudEndpoints = createCrudEndpoints<PageEntity, PageFormValues, PageFormValues, AdminPaginationQuery>({
  baseUrl: "/pages",
  updateMethod: MethodType.PUT,
});
