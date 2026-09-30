import { getZonedParts } from "@kira-joo/toolkit-common";
import { STORE_TIMEZONE } from "src/common/config/store";

/**
 * `YYMMDD-NNNN`, dated in the store's zone: an order at 01:00 Riyadh time is
 * on that Riyadh day wherever the server runs. The counter is zero-padded to
 * four digits and never truncated.
 */
export function orderDayKey(at: Date, timeZone = STORE_TIMEZONE): string {
  const parts = getZonedParts(at, timeZone);
  const yy = String(parts.year % 100).padStart(2, "0");
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function formatOrderNumber(sequence: number, dayKey: string): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error(`Invalid order sequence ${sequence}.`);
  return `${dayKey}-${String(sequence).padStart(4, "0")}`;
}
