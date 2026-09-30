import { toMoney } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { contentImagePolicy, logoImagePolicy, type AssetFieldConfig } from "src/server/core/assets";
import { sanitizeLocalizedRichText } from "src/server/core/html/sanitize-html";
import type { StoreSettingsDto } from "./dto/content.dto";

export const SETTINGS_ASSET_FIELDS: AssetFieldConfig[] = [
  { name: "logo", policy: logoImagePolicy },
  { name: "favicon", policy: { ...logoImagePolicy, minWidth: 16, minHeight: 16 } },
  { name: "legal.vatCertificate", policy: contentImagePolicy },
  { name: "popup.image", policy: contentImagePolicy },
];

export function settingsPayload(dto: StoreSettingsDto) {
  const oid = (id: string) => new mongoose.Types.ObjectId(id);
  return {
    ...dto,
    delivery: {
      ...dto.delivery,
      fee: toMoney(dto.delivery.fee),
      freeShippingThreshold: dto.delivery.freeShippingThreshold ? toMoney(dto.delivery.freeShippingThreshold) : null,
    },
    safeUseText: sanitizeLocalizedRichText(dto.safeUseText),
    ...(dto.footerDescription ? { footerDescription: sanitizeLocalizedRichText(dto.footerDescription) } : {}),
    ...(dto.popup?.body ? { popup: { ...dto.popup, body: sanitizeLocalizedRichText(dto.popup.body) } } : {}),
    searchCategories: (dto.searchCategories ?? []).map(oid),
    searchProducts: (dto.searchProducts ?? []).map(oid),
  };
}
