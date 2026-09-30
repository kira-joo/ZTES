import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductSort } from "src/common/enums";
import { ProductRail } from "src/components/store/product-rail";
import { CartPageClient } from "src/features/storefront/cart/cart-page-client";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized } from "src/lib/localized";
import { listProducts } from "src/server/storefront/catalog.reads";
import { getSettings } from "src/server/storefront/content.reads";

type Props = PageProps<"/[locale]/cart">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title"), alternates: alternatesFor(locale, { ar: "/cart", en: "/cart" }) };
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings, related] = await Promise.all([
    getTranslations("cart"),
    getSettings(),
    listProducts({ sort: ProductSort.BEST_SELLING, limit: 12 }),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <SetAlternatePaths ar="/cart" en="/cart" />
      <h1 className="mb-6 text-2xl font-bold text-ink md:text-3xl">{t("title")}</h1>
      <CartPageClient
        locale={locale}
        safeUseTitle={pickLocalized(settings.safeUseTitle, locale)}
        safeUseText={pickLocalized(settings.safeUseText, locale)}
        relatedRail={related.items.length > 0 ? <ProductRail title={t("relatedTitle")} products={related.items} locale={locale} /> : null}
      />
    </div>
  );
}
