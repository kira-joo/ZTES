import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeSections } from "src/features/storefront/home/home-sections";
import { OrganizationJsonLd } from "src/features/storefront/seo/json-ld";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { getHomeSections, getSettings } from "src/server/storefront/content.reads";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  return { alternates: alternatesFor(locale, { ar: "/", en: "/" }) };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sections, settings] = await Promise.all([getHomeSections(locale as "ar" | "en"), getSettings()]);
  const t = await getTranslations("common");
  return (
    <>
      <OrganizationJsonLd settings={settings} locale={locale} />
      <h1 className="sr-only">{settings.storeName[locale as "ar" | "en"] || t("home")}</h1>
      <HomeSections sections={sections} settings={settings} locale={locale} />
    </>
  );
}
