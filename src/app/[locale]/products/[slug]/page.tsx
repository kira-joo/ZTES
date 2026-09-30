import type { Metadata } from "next";
import { HomeSectionType } from "src/common/enums";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { ProductRail } from "src/components/store/product-rail";
import { RatingStars } from "src/components/store/rating-stars";
import { ProductDescription } from "src/features/storefront/product/product-description";
import { ProductCouponBox } from "src/features/storefront/product/product-coupon-box";
import { ProductGallery } from "src/features/storefront/product/product-gallery";
import { ProductJsonLd } from "src/features/storefront/product/product-json-ld";
import { ProductPurchasePanel } from "src/features/storefront/product/product-purchase-panel";
import { ProductReviews } from "src/features/storefront/product/product-reviews";
import { alternatesFor, absoluteUrl } from "src/features/storefront/seo/alternates";
import { BreadcrumbJsonLd } from "src/features/storefront/seo/json-ld";
import { decodeSlug, otherLocale } from "src/features/storefront/seo/slug";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getPublicCoupon, getHomeSections } from "src/server/storefront/content.reads";
import { getAlsoViewed, getProductBySlug, getProductReviews, getRelatedProducts } from "src/server/storefront/catalog.reads";

type Props = PageProps<"/[locale]/products/[slug]">;

async function load(locale: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const product = await getProductBySlug(locale as "ar" | "en", slug);
  if (product) return product;
  const other = await getProductBySlug(otherLocale(locale), slug);
  if (other) permanentRedirect(`/${locale}/products/${encodeURIComponent(pickSlug(other.slug, locale))}`);
  notFound();
}

async function findSpotlightCoupon(locale: "ar" | "en") {
  const sections = await getHomeSections(locale);
  const spotlight = sections.find((section) => section.type === HomeSectionType.SPOTLIGHT && section.couponCode);
  if (!spotlight) return null;
  return getPublicCoupon(spotlight.couponCode);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await load(locale, slug);
  const title = pickLocalized(product.seo.title, locale) || pickLocalized(product.name, locale);
  const description =
    pickLocalized(product.seo.description, locale) ||
    pickLocalized(product.description, locale).replace(/<[^>]+>/g, "").slice(0, 160);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: alternatesFor(locale, { ar: `/products/${product.slug.ar}`, en: `/products/${product.slug.en}` }),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      type: "website",
      ...(product.images[0]?.secureUrl ? { images: [{ url: product.images[0].secureUrl }] } : {}),
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await load(locale, slug);
  const search = await searchParams;
  const reviewsPage = Math.max(1, Number(search?.reviewsPage) || 1);

  const [t, coupon, related, alsoViewed, reviewsForJsonLd] = await Promise.all([
    getTranslations("product"),
    findSpotlightCoupon(locale as "ar" | "en"),
    getRelatedProducts(product._id, product.primaryCategory?._id ?? null, product.brandId),
    getAlsoViewed(product._id),
    getProductReviews(product._id, 1, 5),
  ]);

  const name = pickLocalized(product.name, locale);
  const description = pickLocalized(product.description, locale);
  const weight = pickLocalized(product.weight, locale);
  const path = `/products/${pickSlug(product.slug, locale)}`;
  const url = absoluteUrl(locale, path);
  const th = await getTranslations("common");

  const crumbs = [
    { label: th("home"), href: "/" },
    ...product.breadcrumb.map((crumb) => ({ label: pickLocalized(crumb.name, locale), href: `/categories/${pickSlug(crumb.slug, locale)}` })),
    { label: name },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 pb-24 sm:pb-6 md:px-4">
      <SetAlternatePaths ar={`/products/${product.slug.ar}`} en={`/products/${product.slug.en}`} />
      <BreadcrumbJsonLd items={crumbs.map((crumb) => ({ name: crumb.label, url: crumb.href ? absoluteUrl(locale, crumb.href) : url }))} />
      <ProductJsonLd product={product} url={url} locale={locale} reviews={reviewsForJsonLd.items} />

      <div className="mb-4">
        <Breadcrumbs items={crumbs} locale={locale} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={name} />
        <div>
          <p className="mb-1 text-xs font-semibold text-brand-dark">{t("vatIncluded")}</p>
          <h1 className="mb-3 text-2xl font-bold text-ink md:text-3xl">{name}</h1>
          {product.ratingCount > 0 ? (
            <a href="#reviews" className="mb-3 inline-flex items-center gap-1.5 text-sm hover:underline">
              <RatingStars value={product.ratingAverage} />
              <span className="text-ink-soft">{t("rating.count", { count: product.ratingCount })}</span>
            </a>
          ) : null}
          <ProductPurchasePanel product={product} locale={locale} shareUrl={url} />
        </div>
      </div>

      {coupon ? (
        <div className="mt-8 max-w-xl">
          <ProductCouponBox coupon={coupon} locale={locale} />
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-10">
          {description ? (
            <div className="rounded-card bg-card p-6 shadow-card">
              <ProductDescription html={description} />
            </div>
          ) : null}
          <ProductReviews productId={product._id} ratingAverage={product.ratingAverage} ratingCount={product.ratingCount} page={reviewsPage} basePath={path} />
        </div>
        {product.sku || weight ? (
          <aside className="h-fit rounded-card bg-card p-6 shadow-card">
            <h2 className="mb-3 text-lg font-bold text-ink">{t("details.title")}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {weight ? (
                <div className="flex justify-between border-b border-line pb-2">
                  <dt className="text-ink-soft">{t("details.weight")}</dt>
                  <dd className="font-medium text-ink">{weight}</dd>
                </div>
              ) : null}
              {product.sku ? (
                <div className="flex justify-between pb-2">
                  <dt className="text-ink-soft">{t("details.sku")}</dt>
                  <dd className="font-medium text-ink" dir="ltr">
                    {product.sku}
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>
        ) : null}
      </div>

      {!product.inStock ? (
        <section className="mt-10 rounded-card bg-card p-6 text-center shadow-card">
          <p className="font-bold text-ink">{t("outOfStock.title")}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("outOfStock.body")}</p>
        </section>
      ) : null}

      <div className="mt-12 flex flex-col gap-12">
        {!product.inStock && related.length > 0 ? (
          <ProductRail title={t("outOfStock.alternatives")} products={related} locale={locale} />
        ) : (
          <ProductRail title={t("related.title")} products={related} locale={locale} />
        )}
        <ProductRail title={t("alsoViewed.title")} products={alsoViewed} locale={locale} />
      </div>
    </div>
  );
}
