import type { MetadataRoute } from "next";
import { Locale } from "src/common/enums";
import { siteUrl } from "src/server/core/config/env";
import { getBrands, getProductSlugs } from "src/server/storefront/catalog.reads";
import { getPages } from "src/server/storefront/content.reads";

/**
 * Every indexable route, in both locales, with `alternates.languages` pointing
 * at each locale's OWN slug — never the same path re-prefixed, since product,
 * category, brand and page slugs differ per locale.
 */
function entry(paths: { ar: string; en: string }, lastModified?: string): MetadataRoute.Sitemap[number] {
  const url = (locale: Locale) => `${siteUrl()}/${locale}${paths[locale] === "/" ? "" : encodeURI(paths[locale])}`;
  return {
    url: url(Locale.AR),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages: { "ar-SA": url(Locale.AR), "en-SA": url(Locale.EN) } },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, pages] = await Promise.all([getProductSlugs(), getBrands(), getPages()]);

  return [
    entry({ ar: "/", en: "/" }),
    entry({ ar: "/brands", en: "/brands" }),
    entry({ ar: "/offers", en: "/offers" }),
    ...products.map((product) => entry({ ar: `/products/${product.slug.ar}`, en: `/products/${product.slug.en}` }, product.updatedAt ?? undefined)),
    ...brands.map((brand) => entry({ ar: `/brands/${brand.slug.ar}`, en: `/brands/${brand.slug.en}` })),
    ...pages.map((page) => entry({ ar: `/pages/${page.slug.ar}`, en: `/pages/${page.slug.en}` }, page.updatedAt)),
  ];
}
