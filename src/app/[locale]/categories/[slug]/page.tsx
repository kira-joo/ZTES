import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { PAGE_CONTENT_SIZES } from "src/components/store/image-sizes";
import { StoreImage } from "src/components/store/store-image";
import { parseListingParams } from "src/features/storefront/listing/listing-params";
import { ProductListing } from "src/features/storefront/listing/product-listing";
import { alternatesFor, absoluteUrl } from "src/features/storefront/seo/alternates";
import { BreadcrumbJsonLd, JsonLd } from "src/features/storefront/seo/json-ld";
import { decodeSlug, otherLocale } from "src/features/storefront/seo/slug";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getCategoryBySlug, listProducts } from "src/server/storefront/catalog.reads";

type Props = PageProps<"/[locale]/categories/[slug]">;

async function load(locale: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const category = await getCategoryBySlug(locale as "ar" | "en", slug);
  if (category) return category;
  // Opened with the other language's slug (e.g. an Arabic link on /en): go to the right one.
  const other = await getCategoryBySlug(otherLocale(locale), slug);
  if (other) permanentRedirect(`/${locale}/categories/${encodeURIComponent(pickSlug(other.slug, locale))}`);
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await load(locale, slug);
  const title = pickLocalized(category.seo.title, locale) || pickLocalized(category.name, locale);
  const description = pickLocalized(category.seo.description, locale) || pickLocalized(category.description, locale).replace(/<[^>]+>/g, "").slice(0, 160);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: alternatesFor(locale, { ar: `/categories/${category.slug.ar}`, en: `/categories/${category.slug.en}` }),
    openGraph: { title, ...(category.image?.secureUrl ? { images: [{ url: category.image.secureUrl }] } : {}) },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = await load(locale, slug);
  const listing = parseListingParams(await searchParams);
  const [list, t] = await Promise.all([listProducts({ category: category._id, ...listing }), getTranslations("common")]);
  const name = pickLocalized(category.name, locale);
  const crumbs = [
    { label: t("home"), href: "/" },
    ...category.breadcrumb.map((crumb) => ({ label: pickLocalized(crumb.name, locale), href: `/categories/${pickSlug(crumb.slug, locale)}` })),
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <SetAlternatePaths ar={`/categories/${category.slug.ar}`} en={`/categories/${category.slug.en}`} />
      <BreadcrumbJsonLd items={crumbs.map((crumb) => ({ name: crumb.label, url: absoluteUrl(locale, crumb.href) }))} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name,
          numberOfItems: list.total,
          itemListElement: list.items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(locale, `/products/${pickSlug(item.slug, locale)}`),
          })),
        }}
      />
      <Breadcrumbs items={crumbs} locale={locale} />
      {category.banner?.secureUrl ? (
        <div className="relative mt-4 aspect-[1420/300] overflow-hidden rounded-card">
          <StoreImage image={category.banner} alt={name} sizes={PAGE_CONTENT_SIZES} fit="cover" priority />
        </div>
      ) : null}
      <h1 className="mb-5 mt-4 text-2xl font-bold text-ink md:text-3xl">{name}</h1>
      <ProductListing list={list} params={listing} basePath={`/categories/${pickSlug(category.slug, locale)}`} locale={locale} />
      {pickLocalized(category.description, locale) ? (
        <div className="rich-text mt-10 rounded-card bg-card p-6 text-sm text-ink-soft shadow-card" dangerouslySetInnerHTML={{ __html: pickLocalized(category.description, locale) }} />
      ) : null}
    </div>
  );
}
