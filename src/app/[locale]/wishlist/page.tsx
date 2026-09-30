import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { WishlistContent } from "./wishlist-content";

type Props = PageProps<"/[locale]/wishlist">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "product.wishlistPage" });
  return {
    title: t("title"),
    alternates: alternatesFor(locale, { ar: "/wishlist", en: "/wishlist" }),
  };
}

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product.wishlistPage");

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <SetAlternatePaths ar="/wishlist" en="/wishlist" />
      <h1 className="mb-6 text-2xl font-bold text-ink md:text-3xl">{t("title")}</h1>
      <WishlistContent locale={locale} />
    </div>
  );
}
