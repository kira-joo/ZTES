import { defineRouting } from "next-intl/routing";
import { Locale } from "src/common/enums";

/**
 * Arabic is the default and `/` always resolves to it rather than negotiating
 * Accept-Language, like the reference store. The locale is always in the URL.
 */
export const routing = defineRouting({
  locales: [Locale.AR, Locale.EN],
  defaultLocale: Locale.AR,
  localeDetection: false,
});
