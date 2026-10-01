import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminImageAsset, AdminPaginationQuery } from "./admin-shared.types";

export interface TestimonialEntity {
  _id: string;
  authorName: string;
  body: LocalizedString;
  rating: number;
  avatar?: AdminImageAsset | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialFormValues {
  authorName: string;
  body: LocalizedString;
  rating?: number;
  avatar?: AdminImageAsset | File | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const testimonialCrudEndpoints = createCrudEndpoints<
  TestimonialEntity,
  TestimonialFormValues,
  TestimonialFormValues,
  AdminPaginationQuery
>({ baseUrl: "/testimonials", updateMethod: MethodType.PUT });
