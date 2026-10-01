import { createCrudEndpoints, MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminLocalizedSlug, AdminPaginationQuery, AdminSeo } from "./admin-shared.types";

export interface CategoryEntity {
  _id: string;
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  description: LocalizedString;
  parent: string | null;
  image?: AdminImageAsset | null;
  icon?: AdminImageAsset | null;
  banner?: AdminImageAsset | null;
  sortOrder: number;
  isActive: boolean;
  showInMenu: boolean;
  seo?: AdminSeo;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormValues {
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  description?: LocalizedString;
  parent?: string | null;
  image?: AdminImageAsset | File | null;
  icon?: AdminImageAsset | File | null;
  banner?: AdminImageAsset | File | null;
  sortOrder?: number;
  isActive?: boolean;
  showInMenu?: boolean;
  seo?: AdminSeo;
}

export interface ListCategoriesQuery extends AdminPaginationQuery {
  isActive?: boolean;
  parent?: string;
}

export const categoryCrudEndpoints = createCrudEndpoints<CategoryEntity, CategoryFormValues, CategoryFormValues, ListCategoriesQuery>({
  baseUrl: "/categories",
  updateMethod: MethodType.PUT,
});

export interface CategoryReorderItem {
  id: string;
  sortOrder: number;
  parent?: string | null;
}

export const categoryReorderEndpoint: Endpoint<{
  body: { items: CategoryReorderItem[] };
  returnType: { updated: number };
}> = { url: "/categories/order", methodType: MethodType.PUT };
