import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { decodeSlug, otherLocale } from "src/features/storefront/seo/slug";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getPageBySlug } from "src/server/storefront/content.reads";

type Props = PageProps<"/[locale]/pages/[slug]">;

async function load(locale: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const page = await getPageBySlug(locale as "ar" | "en", slug);
  if (page) return page;
  const other = await getPageBySlug(otherLocale(locale), slug);
  if (other) permanentRedirect(`/${locale}/pages/${encodeURIComponent(pickSlug(other.slug, locale))}`);
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await load(locale, slug);
  const title = pickLocalized(page.seo.title, locale) || pickLocalized(page.title, locale);
  const description = pickLocalized(page.seo.description, locale);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: alternatesFor(locale, { ar: `/pages/${page.slug.ar}`, en: `/pages/${page.slug.en}` }),
  };
}

export default async function StaticPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = await load(locale, slug);
  const t = await getTranslations("common");
  const body = pickLocalized(page.body, locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SetAlternatePaths ar={`/pages/${page.slug.ar}`} en={`/pages/${page.slug.en}`} />
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: pickLocalized(page.title, locale) }]} locale={locale} />
      <h1 className="mb-6 mt-4 text-2xl font-bold text-ink md:text-3xl">{pickLocalized(page.title, locale)}</h1>
      {body ? <div className="rich-text text-ink-soft" dangerouslySetInnerHTML={{ __html: body }} /> : null}
    </div>
  );
}
