import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { parseListingParams } from "src/features/storefront/listing/listing-params";
import { ProductListing } from "src/features/storefront/listing/product-listing";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { listProducts } from "src/server/storefront/catalog.reads";

export async function generateMetadata({ params }: PageProps<"/[locale]/offers">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listing" });
  return { title: t("offersTitle"), description: t("offersSubtitle"), alternates: alternatesFor(locale, { ar: "/offers", en: "/offers" }) };
}

export default async function OffersPage({ params, searchParams }: PageProps<"/[locale]/offers">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const listing = parseListingParams(await searchParams);
  const [list, t, tl] = await Promise.all([listProducts({ onSale: true, ...listing }), getTranslations("common"), getTranslations("listing")]);
  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: tl("offersTitle") }]} locale={locale} />
      <h1 className="mt-4 text-2xl font-bold text-ink md:text-3xl">{tl("offersTitle")}</h1>
      <p className="mb-5 mt-1 text-sm text-ink-soft">{tl("offersSubtitle")}</p>
      <ProductListing list={list} params={listing} basePath="/offers" locale={locale} />
    </div>
  );
}
