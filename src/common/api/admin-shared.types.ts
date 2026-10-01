import type { LocalizedString } from "@kira-joo/toolkit-common";

/**
 * Mirrors `@kira-joo/toolkit-common`'s `ImageAsset` — redeclared here (rather
 * than imported from a `/server`-only path) because these types describe the
 * JSON shape returned over the wire, which every admin endpoints file needs
 * from a browser-safe module.
 */
export interface AdminImageAsset {
  provider: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  version?: number;
  placeholderUrl?: string;
}

export interface AdminLocalizedSlug {
  ar: string;
  en: string;
}

export interface AdminSeo {
  title?: LocalizedString;
  description?: LocalizedString;
}

export interface AdminPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}
