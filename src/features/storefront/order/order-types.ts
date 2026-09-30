import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { CouponType, OrderStatus, PaymentMethod, TimelineActor } from "src/common/enums";

/**
 * The JSON-safe shape of `findAccessibleOrder`'s result after `toPlain` —
 * money as fixed-scale strings, ObjectIds and Dates as strings. Kept local to
 * the order track: the order page reads `OrderSchema` directly (per its
 * contract) rather than through a route, so it must normalise itself the same
 * way `route-factories.ts` does for every other response.
 */
export interface OrderLineSnapshotView {
  product: string;
  name: LocalizedString;
  slug: { ar: string; en: string };
  sku?: string;
  imageUrl?: string;
  selectedOptions: { groupId: string; group: LocalizedString; valueId: string; value: LocalizedString; priceDelta: string }[];
  unitPrice: string;
  compareAtPrice: string | null;
  quantity: number;
  lineGross: string;
  tierPercent: number;
  tierDiscount: string;
  lineTotal: string;
}

export interface OrderPlainView {
  _id: string;
  orderNumber: string;
  customer: string;
  contact: { firstName: string; lastName: string; phone: string; email: string };
  deliveryAddress: { city: LocalizedString; district: string; street: string; building: string; notes: string; mapUrl: string };
  lines: OrderLineSnapshotView[];
  pricing: { subtotal: string; couponDiscount: string; shippingFee: string; total: string; vatIncluded: string; vatRate: number };
  coupon: { coupon: string; code: string; type: CouponType; value: string; freeShipping: boolean } | null;
  gift: { senderName: string; recipientName: string; recipientPhone: string; message: string; deliverOn: string | null } | null;
  safeUse: { text: LocalizedString; acceptedAt: string };
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  timeline: { status: OrderStatus; at: string; actor: TimelineActor; note: string }[];
  locale: "ar" | "en";
  contactMismatch: boolean;
  customerNotes: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}
