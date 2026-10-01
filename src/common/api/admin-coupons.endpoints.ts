import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminPaginationQuery } from "./admin-shared.types";

export type CouponType = "PERCENT" | "FIXED";

export interface CouponEntity {
  _id: string;
  code: string;
  description: LocalizedString;
  type: CouponType;
  value: string;
  minSubtotal?: string | null;
  maxDiscount?: string | null;
  freeShipping: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponFormValues {
  code: string;
  description?: LocalizedString;
  type: CouponType;
  value: string;
  minSubtotal?: string | null;
  maxDiscount?: string | null;
  freeShipping?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface ListCouponsQuery extends AdminPaginationQuery {
  isActive?: boolean;
}

export const couponCrudEndpoints = createCrudEndpoints<CouponEntity, CouponFormValues, CouponFormValues, ListCouponsQuery>({
  baseUrl: "/coupons",
  updateMethod: MethodType.PUT,
});
