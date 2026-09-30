import type { Metadata } from "next";
import { siteUrl } from "src/server/core/config/env";

/** Canonical + hreflang for a page whose path differs per locale. Paths exclude the locale prefix. */
export function alternatesFor(locale: string, paths: { ar: string; en: string }): Metadata["alternates"] {
  const url = (code: "ar" | "en") => `${siteUrl()}/${code}${paths[code] === "/" ? "" : encodeURI(paths[code])}`;
  return {
    canonical: url(locale === "en" ? "en" : "ar"),
    languages: { "ar-SA": url("ar"), "en-SA": url("en"), "x-default": url("ar") },
  };
}

export function absoluteUrl(locale: string, path: string): string {
  return `${siteUrl()}/${locale}${path === "/" ? "" : encodeURI(path)}`;
}
