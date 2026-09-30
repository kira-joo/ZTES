import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { OrderStatus } from "src/common/enums";
import type { AdminImageAsset } from "./admin-shared.types";

export interface DashboardLowStockRow {
  _id: string;
  name: LocalizedString;
  stock: number;
  images: AdminImageAsset[];
  slug: { ar: string; en: string };
}

export interface DashboardLatestOrderRow {
  _id: string;
  orderNumber: string;
  contact: { firstName: string; lastName: string; phone: string; email: string };
  pricing: { total: string };
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardView {
  ordersByStatus: Record<OrderStatus, number>;
  ordersToday: number;
  ordersThisWeek: number;
  deliveredRevenueThisWeek: string;
  lowStock: DashboardLowStockRow[];
  latestOrders: DashboardLatestOrderRow[];
  customerCount: number;
  contactMismatches: number;
}

export const dashboardEndpoint: Endpoint<{ returnType: DashboardView }> = {
  url: "/dashboard",
  methodType: MethodType.GET,
};
