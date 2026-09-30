"use client";

import { useSyncExternalStore } from "react";
import type { CartView } from "src/common/types/cart";

const PREFIX = "ztes:safe-use:";
const EVENT = "ztes:safe-use-change";

/** A stable signature for "this set of cart lines" — quantity doesn't change what was acknowledged. */
export function cartSignature(cart: CartView | undefined): string {
  return cart ? [...cart.lines.map((line) => line.lineId)].sort().join("|") : "";
}

function read(signature: string): boolean {
  if (!signature) return false;
  try {
    return window.sessionStorage.getItem(PREFIX + signature) === "1";
  } catch {
    return false;
  }
}

function write(signature: string, next: boolean) {
  if (!signature) return;
  try {
    if (next) window.sessionStorage.setItem(PREFIX + signature, "1");
    else window.sessionStorage.removeItem(PREFIX + signature);
  } catch {
    /* sessionStorage unavailable: the checkbox simply won't persist across navigation */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The safe-use acknowledgement checkbox state, persisted in sessionStorage
 * keyed by the cart's current line set — so navigating from the cart to
 * checkout keeps it checked, but a genuinely different cart (or a cleared
 * one) starts unacknowledged again. The server enforces this independently at
 * placement; this is only the UI gate. Modelled as an external store (like
 * `use-wishlist.ts`'s device-local list) rather than effect-synced state, so
 * a signature change is read on the next render instead of a post-mount
 * `setState`.
 */
export function useSafeUseAcceptance(signature: string) {
  const accepted = useSyncExternalStore(subscribe, () => read(signature), () => false);
  const update = (next: boolean) => write(signature, next);
  return [accepted, update] as const;
}
