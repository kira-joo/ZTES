"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The wishlist. The reference ties it to a customer account; ZTES has no
 * accounts, so it lives on the device (localStorage — a per-viewer
 * convenience, never anything security-relevant). Every read and write is
 * guarded: storage can be unavailable (private mode, blocked site data).
 *
 * CONTRACT used across the storefront. Keep these signatures stable.
 */
const KEY = "ztes:wishlist";
const EVENT = "ztes:wishlist-change";
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.ids;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = { raw, ids: Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : EMPTY };
    return cache.ids;
  } catch {
    return EMPTY;
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: the change lasts for this page only */
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

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((existing) => existing !== id) : [id, ...current].slice(0, 200));
  }, []);
  return { ids, has, toggle, count: ids.length };
}
