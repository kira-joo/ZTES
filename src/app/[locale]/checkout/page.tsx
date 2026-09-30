import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "src/features/storefront/checkout/checkout-form";
import { alternatesFor } from "src/features/storefront/seo/alternates";
import { SetAlternatePaths } from "src/features/storefront/shell/alternate-links";
import { pickLocalized } from "src/lib/localized";
import { getSettings } from "src/server/storefront/content.reads";

type Props = PageProps<"/[locale]/checkout">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title"), alternates: alternatesFor(locale, { ar: "/checkout", en: "/checkout" }) };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations("checkout"), getSettings()]);

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-4">
      <SetAlternatePaths ar="/checkout" en="/checkout" />
      <h1 className="mb-6 text-2xl font-bold text-ink md:text-3xl">{t("title")}</h1>
      <CheckoutForm
        cityLabel={pickLocalized(settings.delivery.city, locale)}
        deliveryEstimate={pickLocalized(settings.delivery.estimate, locale)}
        safeUseTitle={pickLocalized(settings.safeUseTitle, locale)}
        safeUseText={pickLocalized(settings.safeUseText, locale)}
      />
    </div>
  );
}
