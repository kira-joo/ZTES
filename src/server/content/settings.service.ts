import { resolveSession } from "@kira-joo/backend-toolkit-mongoose";
import { toMoney } from "@kira-joo/toolkit-common";
import { StoreSettingsModel, type StoreSettingsSchema } from "./store-settings.schema";

/**
 * The first read creates the singleton with neutral defaults, so a fresh
 * database serves a working (if unbranded) store instead of a 500.
 */
export const SETTINGS_DEFAULTS = {
  storeName: { ar: "ZTES", en: "ZTES" },
  delivery: {
    city: { ar: "الرياض", en: "Riyadh" },
    fee: toMoney(0),
    freeShippingThreshold: null,
    estimate: { ar: "", en: "" },
  },
  vatRate: 15,
  safeUseTitle: { ar: "إقرار الاستخدام الآمن", en: "Safe use acknowledgement" },
  safeUseText: {
    ar: "المبيدات تُستخدم حسب الملصق وبعيدًا عن الأطفال",
    en: "Pesticides are used according to the label and kept away from children",
  },
};

export async function getSettingsDocument(): Promise<StoreSettingsSchema> {
  const session = resolveSession() ?? null;
  const existing = await StoreSettingsModel.findOne({}).session(session).lean<StoreSettingsSchema>();
  if (existing) return existing;

  await StoreSettingsModel.updateOne({}, { $setOnInsert: SETTINGS_DEFAULTS }, { upsert: true, session: session ?? undefined });
  return (await StoreSettingsModel.findOne({}).session(session).lean<StoreSettingsSchema>())!;
}
