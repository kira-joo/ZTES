import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminPaginationQuery } from "./admin-shared.types";
import type { OrderStatus } from "src/common/enums";

export interface CustomerAddressSnapshot {
  city: LocalizedString;
  district: string;
  street: string;
  building: string;
  notes: string;
  mapUrl: string;
}

export interface CustomerEntity {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lastAddress?: CustomerAddressSnapshot | null;
  orderCount: number;
  lastOrderAt?: string | null;
  createdAt: string;
}

export interface CustomerOrderSummary {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  pricing: { total: string };
  createdAt: string;
}

export interface CustomerDetail {
  customer: CustomerEntity;
  orders: CustomerOrderSummary[];
}

export const CUSTOMER_ROUTES = {
  collection: "/customers",
  item: "/customers/:id",
} as const;

export const customerListEndpoint: Endpoint<{
  query: AdminPaginationQuery & Record<string, unknown>;
  returnType: { data: CustomerEntity[]; total: number; page?: number; limit?: number; totalPages?: number };
}> = { url: CUSTOMER_ROUTES.collection, methodType: MethodType.GET };

export const customerDetailEndpoint: Endpoint<{ params: { id: string }; returnType: CustomerDetail }> = {
  url: CUSTOMER_ROUTES.item,
  methodType: MethodType.GET,
};
