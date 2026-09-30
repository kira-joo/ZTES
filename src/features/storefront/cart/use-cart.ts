"use client";

import { useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { useQueryClient } from "@tanstack/react-query";
import {
  addCartItemEndpoint,
  applyCouponEndpoint,
  getCartEndpoint,
  placeOrderEndpoint,
  removeCartItemEndpoint,
  removeCouponEndpoint,
  setGiftEndpoint,
  updateCartItemEndpoint,
  type PlaceOrderBody,
} from "api/storefront-cart.endpoints";
import { buildRequesterQueryKey } from "@kira-joo/frontend-toolkit-core";
import { useRef } from "react";
import type { CartGiftView, CartView } from "src/common/types/cart";
import { getStorefrontApi } from "src/lib/api-client";

/**
 * The guest cart. The server owns it (httpOnly cookie); every mutation returns
 * the re-priced cart, which replaces the cached one — so the badge, the cart
 * page and checkout never disagree.
 *
 * CONTRACT used across the storefront. Keep these signatures stable.
 */
export const CART_QUERY_KEY = buildRequesterQueryKey(getCartEndpoint);

export function useCart() {
  const query = useRequesterQuery({
    endpoint: getCartEndpoint,
    client: getStorefrontApi(),
    queryOptions: { staleTime: 30_000 },
  });
  return { cart: query.data as CartView | undefined, loading: query.loading, error: query.error, refetch: query.refetch };
}

function useSetCart() {
  const queryClient = useQueryClient();
  return (cart: CartView) => queryClient.setQueryData(CART_QUERY_KEY, cart);
}

export function useAddToCart() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({
    endpoint: addCartItemEndpoint,
    client: getStorefrontApi(),
    onSuccess: setCart,
  });
  return {
    addToCart: (input: { productId: string; optionValueIds?: string[]; quantity: number }) =>
      mutation.mutateAsync({ body: input }),
    pending: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateCartLine() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({ endpoint: updateCartItemEndpoint, client: getStorefrontApi(), onSuccess: setCart });
  return {
    updateLine: (lineId: string, quantity: number) => mutation.mutateAsync({ params: { lineId }, body: { quantity } }),
    pending: mutation.isPending,
  };
}

export function useRemoveCartLine() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({ endpoint: removeCartItemEndpoint, client: getStorefrontApi(), onSuccess: setCart });
  return { removeLine: (lineId: string) => mutation.mutateAsync({ params: { lineId } }), pending: mutation.isPending };
}

export function useApplyCoupon() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({
    endpoint: applyCouponEndpoint,
    client: getStorefrontApi(),
    onSuccess: (result) => setCart(result.cart),
  });
  return {
    applyCoupon: (code: string) => mutation.mutateAsync({ body: { code } }),
    pending: mutation.isPending,
    error: mutation.error,
  };
}

export function useRemoveCoupon() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({ endpoint: removeCouponEndpoint, client: getStorefrontApi(), onSuccess: setCart });
  return { removeCoupon: () => mutation.mutateAsync({}), pending: mutation.isPending };
}

export function useSetGift() {
  const setCart = useSetCart();
  const mutation = useRequesterMutation({ endpoint: setGiftEndpoint, client: getStorefrontApi(), onSuccess: setCart });
  return {
    setGift: (gift: (Omit<CartGiftView, "deliverOn"> & { deliverOn?: string | null }) | null) => mutation.mutateAsync({ body: { gift } }),
    pending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Places the order with a per-attempt `Idempotency-Key`. The key is generated
 * once per NEW submit and reused across retries of that same submit (a
 * network failure, a transient conflict) — never regenerated just because the
 * request is being sent again — so a retried POST cannot create a second
 * order. Call `resetAttempt()` only once the flow genuinely restarts (e.g. the
 * cart changed and the customer must resubmit from scratch).
 */
export function usePlaceOrder() {
  const mutation = useRequesterMutation({ endpoint: placeOrderEndpoint, client: getStorefrontApi() });
  const keyRef = useRef<string | null>(null);

  function resetAttempt() {
    keyRef.current = null;
  }

  function placeOrder(body: PlaceOrderBody) {
    keyRef.current ??= crypto.randomUUID();
    return mutation.mutateAsync({ body, headers: { "Idempotency-Key": keyRef.current } });
  }

  return { placeOrder, resetAttempt, pending: mutation.isPending, error: mutation.error };
}
