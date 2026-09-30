import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "src/components/store/breadcrumbs";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getBrands } from "src/server/storefront/catalog.reads";

export async function generateMetadata({ params }: PageProps<"/[locale]/brands">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listing" });
  return { title: t("brandsIndexTitle"), alternates: alternatesFor(locale, { ar: "/brands", en: "/brands" }) };
}

export default async function BrandsPage({ params }: PageProps<"/[locale]/brands">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [brands, t, tl] = await Promise.all([getBrands(), getTranslations("common"), getTranslations("listing")]);
  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: tl("brandsIndexTitle") }]} locale={locale} />
      <h1 className="mb-6 mt-4 text-2xl font-bold text-ink md:text-3xl">{tl("brandsIndexTitle")}</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {brands.map((brand) => {
          const name = pickLocalized(brand.name, locale);
          return (
            <li key={brand._id}>
              <Link href={`/brands/${pickSlug(brand.slug, locale)}`} className="flex h-full flex-col items-center gap-2 rounded-card bg-card p-4 text-center shadow-card hover:ring-2 hover:ring-brand">
                <span className="relative aspect-[3/2] w-full">
                  {brand.logo?.secureUrl ? <Image src={brand.logo.secureUrl} alt="" fill sizes="200px" className="object-contain" /> : <span className="grid size-full place-items-center rounded-lg bg-band text-2xl font-bold text-ink-muted">{name.slice(0, 1)}</span>}
                </span>
                <span className="text-sm font-semibold text-ink">{name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
