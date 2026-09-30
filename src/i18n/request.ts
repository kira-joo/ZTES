import { hasLocale, IntlErrorCode, type IntlError } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * UI chrome only. Store content (products, categories, pages) is `{ ar, en }`
 * data rendered through `pickLocalized`; the two never route through each other.
 */
/**
 * One file per namespace and locale. Ownership: common/shell/home/listing/
 * content belong to the shell & catalog track; product/cart/checkout/order/
 * validation to the product & checkout track.
 */
const NAMESPACES = [
  "common",
  "shell",
  "home",
  "listing",
  "content",
  "product",
  "cart",
  "checkout",
  "order",
  "validation",
] as const;

async function loadMessages(locale: string) {
  const entries = await Promise.all(
    NAMESPACES.map(async (namespace) => [namespace, (await import(`./messages/${locale}/${namespace}.json`)).default] as const)
  );
  return Object.fromEntries(entries);
}

function onError(error: IntlError) {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (process.env.NODE_ENV === "development") console.error(error);
    else console.warn(error.message);
    return;
  }
  console.error(error);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: await loadMessages(locale),
    onError,
    getMessageFallback: ({ namespace, key }) => `[missing: ${namespace ? `${namespace}.${key}` : key}]`,
  };
});
