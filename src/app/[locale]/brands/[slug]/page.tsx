import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { parseListingParams } from "src/features/storefront/listing/listing-params";
import { ProductListing } from "src/features/storefront/listing/product-listing";
import { alternatesFor, absoluteUrl } from "src/features/storefront/seo/alternates";
import { BreadcrumbJsonLd } from "src/features/storefront/seo/json-ld";
import { decodeSlug, otherLocale } from "src/features/storefront/seo/slug";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getBrandBySlug, listProducts } from "src/server/storefront/catalog.reads";

type Props = PageProps<"/[locale]/brands/[slug]">;

async function load(locale: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const brand = await getBrandBySlug(locale as "ar" | "en", slug);
  if (brand) return brand;
  const other = await getBrandBySlug(otherLocale(locale), slug);
  if (other) permanentRedirect(`/${locale}/brands/${encodeURIComponent(pickSlug(other.slug, locale))}`);
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const brand = await load(locale, slug);
  const title = pickLocalized(brand.seo.title, locale) || pickLocalized(brand.name, locale);
  const description = pickLocalized(brand.seo.description, locale) || pickLocalized(brand.description, locale).replace(/<[^>]+>/g, "").slice(0, 160);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: alternatesFor(locale, { ar: `/brands/${brand.slug.ar}`, en: `/brands/${brand.slug.en}` }),
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const brand = await load(locale, slug);
  const listing = parseListingParams(await searchParams);
  const [list, t, ts] = await Promise.all([listProducts({ brand: brand._id, ...listing }), getTranslations("common"), getTranslations("shell")]);
  const name = pickLocalized(brand.name, locale);
  const crumbs = [
    { label: t("home"), href: "/" },
    { label: ts("brands"), href: "/brands" },
    { label: name, href: `/brands/${pickSlug(brand.slug, locale)}` },
  ];
  const description = pickLocalized(brand.description, locale);

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <SetAlternatePaths ar={`/brands/${brand.slug.ar}`} en={`/brands/${brand.slug.en}`} />
      <BreadcrumbJsonLd items={crumbs.map((crumb) => ({ name: crumb.label, url: absoluteUrl(locale, crumb.href) }))} />
      <Breadcrumbs items={crumbs} locale={locale} />
      <div className="mb-6 mt-4 flex items-center gap-4">
        {brand.logo?.secureUrl ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-card bg-card shadow-card">
            <Image src={brand.logo.secureUrl} alt={name} fill sizes="80px" className="object-contain p-2" />
          </span>
        ) : null}
        <h1 className="text-2xl font-bold text-ink md:text-3xl">{name}</h1>
      </div>
      {description ? <div className="rich-text mb-6 rounded-card bg-card p-5 text-sm text-ink-soft shadow-card" dangerouslySetInnerHTML={{ __html: description }} /> : null}
      <ProductListing list={list} params={listing} basePath={`/brands/${pickSlug(brand.slug, locale)}`} locale={locale} />
    </div>
  );
}
