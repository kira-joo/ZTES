/**
 * The cart as the storefront sees it. Produced by the cart service, returned
 * by every /api/storefront/cart* route. Money is a fixed-scale string.
 */
import type { LocalizedString } from "@kira-joo/toolkit-common";

export type CartLineIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | "OPTION_REQUIRED" | "OPTION_UNAVAILABLE";
export type CouponRejectionCode = "NOT_FOUND" | "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "USAGE_LIMIT" | "MIN_SUBTOTAL";

export interface CartGiftView {
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  deliverOn?: string | Date | null;
}

export interface CartLineView {
  lineId: string;
  productId: string;
  name: LocalizedString;
  slug: { ar: string; en: string };
  imageUrl: string | null;
  weight: LocalizedString | null;
  options: { group: LocalizedString; value: LocalizedString }[];
  unitPrice: string;
  compareAtPrice: string | null;
  quantity: number;
  lineGross: string;
  tierPercent: number;
  tierDiscount: string;
  lineTotal: string;
  nextTier: { minQuantity: number; percent: number } | null;
  issue: CartLineIssue | null;
  available?: number;
}

export interface CartView {
  lines: CartLineView[];
  itemCount: number;
  coupon: { code: string; description: LocalizedString; valid: boolean; rejection: CouponRejectionCode | null } | null;
  gift: CartGiftView | null;
  pricing: {
    subtotal: string;
    couponDiscount: string;
    shippingFee: string;
    total: string;
    vatIncluded: string;
    totalBeforeVat: string;
    vatRate: number;
    amountToFreeShipping: string | null;
    freeShippingThreshold: string | null;
    freeShippingApplied: boolean;
  };
  hasIssues: boolean;
}

