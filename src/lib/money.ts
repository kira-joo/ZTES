import { moneyView } from "@kira-joo/toolkit-common";
import { STORE_CURRENCY } from "src/common/config/store";

/**
 * The number only ("89" / "89.50", with locale digits and grouping). The riyal
 * mark is drawn by <RiyalSymbol/>, because the new Saudi riyal sign has no
 * reliable font support yet. Money arrives as a string; it is never parsed to
 * a float here.
 */
export function formatAmount(value: string, locale: string): string {
  const numberLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA";
  return moneyView(STORE_CURRENCY, numberLocale).format(value, { display: "none", trimZeroFraction: true });
}
