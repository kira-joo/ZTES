import { createCrudEndpoints, MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminLocalizedSlug, AdminPaginationQuery, AdminSeo } from "./admin-shared.types";

export type ProductOptionType = "THUMBNAIL" | "TEXT";
export type BadgeTone = "PRIMARY" | "SALE" | "NEUTRAL" | "DARK";

export interface ProductOptionValue {
  _id?: string;
  label: LocalizedString;
  priceDelta?: string;
  image?: AdminImageAsset | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface ProductOptionGroup {
  _id?: string;
  name: LocalizedString;
  type: ProductOptionType;
  required?: boolean;
  values: ProductOptionValue[];
}

export interface ProductBadge {
  label: LocalizedString;
  tone: BadgeTone;
}

export interface ProductQuantityTier {
  minQuantity: number;
  percent: number;
}

export interface ProductBrandSummary {
  _id: string;
  name: LocalizedString;
}

export interface ProductEntity {
  _id: string;
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  description: LocalizedString;
  sku?: string;
  brand: ProductBrandSummary | string | null;
  categories: string[];
  primaryCategory: string | null;
  images: AdminImageAsset[];
  price: string;
  compareAtPrice?: string | null;
  saleEndsAt?: string | null;
  stock: number;
  trackStock: boolean;
  weight: LocalizedString;
  options: ProductOptionGroup[];
  badge?: ProductBadge | null;
  quantityTiers: ProductQuantityTier[];
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  sortOrder: number;
  seo?: AdminSeo;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  name: LocalizedString;
  slug: AdminLocalizedSlug;
  description?: LocalizedString;
  sku?: string;
  brand?: string | null;
  categories: string[];
  primaryCategory?: string | null;
  price: string;
  compareAtPrice?: string | null;
  saleEndsAt?: string | null;
  stock?: number;
  trackStock?: boolean;
  weight?: LocalizedString;
  options?: ProductOptionGroup[];
  badge?: ProductBadge | null;
  quantityTiers?: ProductQuantityTier[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seo?: AdminSeo;
}

export interface ListProductsQuery extends AdminPaginationQuery {
  isActive?: boolean;
  isFeatured?: boolean;
  brand?: string;
  categories?: string;
  stockLevel?: "low" | "out";
}

/** JSON only — the create/update route never accepts multipart; the gallery is a separate sub-resource. */
export const productCrudEndpoints = createCrudEndpoints<ProductEntity, ProductFormValues, ProductFormValues, ListProductsQuery>({
  baseUrl: "/products",
  updateMethod: MethodType.PUT,
});

export const productStatusEndpoint: Endpoint<{
  params: { id: string };
  body: { isActive: boolean };
  returnType: ProductEntity;
}> = { url: "/products/:id/status", methodType: MethodType.PUT };

export const productImageUploadEndpoint: Endpoint<{
  params: { id: string };
  returnType: AdminImageAsset;
}> = { url: "/products/:id/images", methodType: MethodType.POST };

export const productImageDeleteEndpoint: Endpoint<{
  params: { id: string };
  query: { publicId: string };
  returnType: { removed: boolean };
}> = { url: "/products/:id/images", methodType: MethodType.DELETE };

export const productImageOrderEndpoint: Endpoint<{
  params: { id: string };
  body: { publicIds: string[] };
  returnType: { images: AdminImageAsset[] };
}> = { url: "/products/:id/images/order", methodType: MethodType.PUT };
