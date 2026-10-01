import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminPaginationQuery } from "./admin-shared.types";
import type { OrderStatus } from "src/common/enums";

export interface AddressSnapshot {
  city: LocalizedString;
  district: string;
  street: string;
  building: string;
  notes: string;
  mapUrl: string;
}

export interface ContactSnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface SelectedOptionSnapshot {
  groupId: string;
  group: LocalizedString;
  valueId: string;
  value: LocalizedString;
  priceDelta: string;
}

export interface OrderLineSnapshot {
  product: string;
  name: LocalizedString;
  slug: { ar: string; en: string };
  sku?: string;
  imageUrl?: string;
  selectedOptions: SelectedOptionSnapshot[];
  unitPrice: string;
  compareAtPrice?: string | null;
  quantity: number;
  lineGross: string;
  tierPercent: number;
  tierDiscount: string;
  lineTotal: string;
}

export interface OrderPricing {
  subtotal: string;
  couponDiscount: string;
  shippingFee: string;
  total: string;
  vatIncluded: string;
  vatRate: number;
}

export interface CouponSnapshot {
  coupon: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  freeShipping: boolean;
}

export interface GiftDetails {
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  deliverOn?: string | null;
}

export interface SafeUseSnapshot {
  text: LocalizedString;
  acceptedAt: string;
}

export type TimelineActor = "ADMIN" | "CUSTOMER" | "SYSTEM";

export interface TimelineEntry {
  status: OrderStatus;
  at: string;
  actor: TimelineActor;
  note: string;
}

export interface OrderListRow {
  _id: string;
  orderNumber: string;
  customer: string | { _id: string; firstName: string; lastName: string };
  contact: ContactSnapshot;
  pricing: OrderPricing;
  status: OrderStatus;
  contactMismatch: boolean;
  createdAt: string;
}

export interface OrderDetail {
  _id: string;
  orderNumber: string;
  customer: { _id: string; firstName: string; lastName: string; phone: string; email: string } | string;
  contact: ContactSnapshot;
  deliveryAddress: AddressSnapshot;
  lines: OrderLineSnapshot[];
  pricing: OrderPricing;
  coupon?: CouponSnapshot | null;
  gift?: GiftDetails | null;
  safeUse: SafeUseSnapshot;
  paymentMethod: "CASH_ON_DELIVERY";
  status: OrderStatus;
  timeline: TimelineEntry[];
  locale: "ar" | "en";
  contactMismatch: boolean;
  customerNotes: string;
  cancellationReason: string;
  createdAt: string;
  allowedTransitions: OrderStatus[];
}

export interface ListOrdersQuery extends AdminPaginationQuery {
  status?: OrderStatus;
  contactMismatch?: boolean;
  customer?: string;
  from?: string;
  to?: string;
}

export const ORDER_ROUTES = {
  collection: "/orders",
  item: "/orders/:orderNumber",
  status: "/orders/:orderNumber/status",
} as const;

export const orderListEndpoint: Endpoint<{
  query: ListOrdersQuery & Record<string, unknown>;
  returnType: { data: OrderListRow[]; total: number; page?: number; limit?: number; totalPages?: number };
}> = { url: ORDER_ROUTES.collection, methodType: MethodType.GET };

export const orderDetailEndpoint: Endpoint<{ params: { orderNumber: string }; returnType: OrderDetail }> = {
  url: ORDER_ROUTES.item,
  methodType: MethodType.GET,
};

export const orderTransitionEndpoint: Endpoint<{
  params: { orderNumber: string };
  body: { status: OrderStatus; note?: string };
  returnType: OrderDetail;
}> = { url: ORDER_ROUTES.status, methodType: MethodType.PUT };
