import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { CartGiftView, CartView, CouponRejectionCode } from "src/common/types/cart";

/** Paths relative to `/api/storefront` (see src/lib/api-client.ts). */
export const STOREFRONT_CART_ROUTES = {
  cart: "/cart",
  items: "/cart/items",
  item: "/cart/items/:lineId",
  coupon: "/cart/coupon",
  gift: "/cart/gift",
  orders: "/orders",
  order: "/orders/:orderNumber",
  orderReviews: "/orders/:orderNumber/reviews",
} as const;

export const getCartEndpoint: Endpoint<{ returnType: CartView }> = {
  url: STOREFRONT_CART_ROUTES.cart,
  methodType: MethodType.GET,
};

export const addCartItemEndpoint: Endpoint<{
  returnType: CartView;
  body: { productId: string; optionValueIds?: string[]; quantity: number };
}> = { url: STOREFRONT_CART_ROUTES.items, methodType: MethodType.POST };

export const updateCartItemEndpoint: Endpoint<{
  returnType: CartView;
  params: { lineId: string };
  body: { quantity: number };
}> = { url: STOREFRONT_CART_ROUTES.item, methodType: MethodType.PUT };

export const removeCartItemEndpoint: Endpoint<{ returnType: CartView; params: { lineId: string } }> = {
  url: STOREFRONT_CART_ROUTES.item,
  methodType: MethodType.DELETE,
};

export const applyCouponEndpoint: Endpoint<{
  returnType: { applied: boolean; rejection: CouponRejectionCode | null; cart: CartView };
  body: { code: string };
}> = { url: STOREFRONT_CART_ROUTES.coupon, methodType: MethodType.PUT };

export const removeCouponEndpoint: Endpoint<{ returnType: CartView }> = {
  url: STOREFRONT_CART_ROUTES.coupon,
  methodType: MethodType.DELETE,
};

export const setGiftEndpoint: Endpoint<{
  returnType: CartView;
  body: { gift: (Omit<CartGiftView, "deliverOn"> & { deliverOn?: string | null }) | null };
}> = { url: STOREFRONT_CART_ROUTES.gift, methodType: MethodType.PUT };

export interface PlaceOrderBody {
  contact: { firstName: string; lastName: string; phone: string; email: string };
  address: { district: string; street: string; building?: string; notes?: string; mapUrl?: string };
  customerNotes?: string;
  safeUseAccepted: boolean;
  paymentMethod: "CASH_ON_DELIVERY";
  locale: "ar" | "en";
}

/** Send with an `Idempotency-Key` header, generated once per checkout attempt. */
export const placeOrderEndpoint: Endpoint<{ returnType: { orderNumber: string }; body: PlaceOrderBody }> = {
  url: STOREFRONT_CART_ROUTES.orders,
  methodType: MethodType.POST,
};

export const submitReviewEndpoint: Endpoint<{
  returnType: { submitted: boolean };
  params: { orderNumber: string };
  body: { productId: string; rating: number; authorName: string; body?: string };
}> = { url: STOREFRONT_CART_ROUTES.orderReviews, methodType: MethodType.POST };
