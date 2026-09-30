/** The storefront's locales. Arabic is the default and RTL is the primary direction. */
export enum Locale {
  AR = "ar",
  EN = "en",
}

export const LOCALES = [Locale.AR, Locale.EN] as const;

export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  [Locale.AR]: "rtl",
  [Locale.EN]: "ltr",
};

export function isLocale(value: unknown): value is Locale {
  return value === Locale.AR || value === Locale.EN;
}
