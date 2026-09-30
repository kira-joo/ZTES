import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { parseListingParams } from "src/features/storefront/listing/listing-params";
import { ProductListing } from "src/features/storefront/listing/product-listing";
import { listProducts } from "src/server/storefront/catalog.reads";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await params;
  const q = typeof (await searchParams).q === "string" ? ((await searchParams).q as string) : "";
  const t = await getTranslations({ locale, namespace: "listing" });
  return { title: q ? t("searchTitle", { query: q }) : t("searchEmptyTitle"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 80) : "";
  const listing = parseListingParams(raw);
  const [list, t, tl] = await Promise.all([
    q ? listProducts({ search: q, ...listing }) : Promise.resolve({ items: [], total: 0, page: 1, totalPages: 1, facets: { categories: [], brands: [] } }),
    getTranslations("common"),
    getTranslations("listing"),
  ]);
  const title = q ? tl("searchTitle", { query: q }) : tl("searchEmptyTitle");
  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: title }]} locale={locale} />
      <h1 className="mb-5 mt-4 text-2xl font-bold text-ink md:text-3xl">{title}</h1>
      <ProductListing list={list} params={listing} basePath={`/search?q=${encodeURIComponent(q)}`} locale={locale} />
    </div>
  );
}
