import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { StoreImage } from "src/components/store/store-image";
import { getPosts } from "src/server/storefront/content.reads";

const PAGE_SIZE = 12;

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("blogTitle"), description: t("blogSubtitle"), alternates: alternatesFor(locale, { ar: "/blog", en: "/blog" }) };
}

export default async function BlogIndexPage({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ items, total }, t, th, tc] = await Promise.all([
    getPosts(locale as "ar" | "en", page, PAGE_SIZE),
    getTranslations("content"),
    getTranslations("home"),
    getTranslations("common"),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <Breadcrumbs items={[{ label: tc("home"), href: "/" }, { label: th("blogTitle") }]} locale={locale} />
      <h1 className="mb-1 mt-4 text-2xl font-bold text-ink md:text-3xl">{th("blogTitle")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{th("blogSubtitle")}</p>

      {items.length === 0 ? (
        <p className="rounded-card bg-card p-10 text-center text-ink-soft shadow-card">{t("blogEmpty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <li key={post._id}>
              <Link href={`/blog/${pickSlug(post.slug, locale)}`} className="flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card transition hover:shadow-lg">
                <span className="relative block aspect-[16/9] bg-band">
                  <StoreImage image={post.cover} alt={pickLocalized(post.title, locale)} sizes="(min-width: 1024px) 32vw, 90vw" fit="cover" />
                </span>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="font-bold text-ink">{pickLocalized(post.title, locale)}</h2>
                  <p className="line-clamp-3 text-sm text-ink-soft">{pickLocalized(post.excerpt, locale)}</p>
                  <p className="mt-auto text-xs text-ink-muted">
                    {t("publishedOn", { date: new Date(post.publishedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA") })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex justify-center gap-2" aria-label="pagination">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
            <Link
              key={number}
              href={`/blog${number > 1 ? `?page=${number}` : ""}`}
              aria-current={number === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center rounded-card border px-2 text-sm font-medium ${
                number === page ? "border-brand bg-brand text-white" : "border-line bg-card text-ink hover:border-brand"
              }`}
            >
              {number}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
