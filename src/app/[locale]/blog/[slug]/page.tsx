import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { StoreImage } from "src/components/store/store-image";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { decodeSlug } from "src/features/storefront/seo/slug";
import { pickLocalized } from "src/lib/localized";
import { getPostBySlug } from "src/server/storefront/content.reads";

type Props = PageProps<"/[locale]/blog/[slug]">;

/**
 * Arabic-only on the reference: a post with no EN title/body is filtered out
 * of `getPostBySlug` for `/en`, so this genuinely 404s rather than falling
 * back to an untranslated read — there is no other-locale redirect here.
 */
async function load(locale: string, rawSlug: string) {
  const post = await getPostBySlug(locale as "ar" | "en", decodeSlug(rawSlug));
  if (!post) notFound();
  return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await load(locale, slug);
  const title = pickLocalized(post.seo.title, locale) || pickLocalized(post.title, locale);
  const description = pickLocalized(post.seo.description, locale) || pickLocalized(post.excerpt, locale);
  return {
    title,
    ...(description ? { description } : {}),
    ...(post.cover?.secureUrl ? { openGraph: { images: [{ url: post.cover.secureUrl }] } } : {}),
    // Single-locale content: no cross-locale alternate exists.
    alternates: { canonical: alternatesFor(locale, { ar: `/blog/${post.slug.ar}`, en: `/blog/${post.slug.ar}` })!.canonical },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await load(locale, slug);
  const t = await getTranslations("common");
  const tc = await getTranslations("content");
  const ts = await getTranslations("shell");
  const body = pickLocalized(post.body, locale);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: ts("blog"), href: "/blog" }, { label: pickLocalized(post.title, locale) }]} locale={locale} />
      <h1 className="mb-2 mt-4 text-2xl font-bold text-ink md:text-3xl">{pickLocalized(post.title, locale)}</h1>
      <p className="mb-6 text-xs text-ink-muted">
        {tc("publishedOn", { date: new Date(post.publishedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA") })}
      </p>
      {post.cover?.secureUrl ? (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-card bg-band">
          <StoreImage image={post.cover} alt={pickLocalized(post.title, locale)} sizes="(min-width: 768px) 48rem, 100vw" fit="cover" priority />
        </div>
      ) : null}
      {body ? <div className="rich-text text-ink-soft" dangerouslySetInnerHTML={{ __html: body }} /> : null}
    </article>
  );
}
