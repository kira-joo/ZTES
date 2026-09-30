import { STORE_COUNTRY_CODE } from "src/common/config/store";

/**
 * A Saudi mobile as the checkout/gift forms collect it: the customer types
 * only the local part next to a fixed "+966" prefix shown in the UI. Shared
 * by the checkout form and the cart's gift dialog, so both send the backend
 * the same shape the `SAUDI_MOBILE` DTO pattern accepts.
 */
export const SAUDI_LOCAL_MOBILE = /^5\d{8}$/;

/** The 9-digit local part after "+966" — what the input actually holds. */
export function stripSaudiPrefix(value: string): string {
  return value.replace(/^\+?966/, "");
}

/** Local digits -> the full `+9665XXXXXXXX` string the backend's DTO accepts. */
export function toE164SaudiPhone(local: string): string {
  return `${STORE_COUNTRY_CODE}${local}`;
}
