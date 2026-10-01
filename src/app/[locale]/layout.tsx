import type { Metadata, Viewport } from "next";
import { Readex_Pro } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALE_DIRECTION, type Locale } from "src/common/enums";
import { FloatingActions } from "src/features/storefront/shell/floating-actions";
import { PromoPopup } from "src/features/storefront/shell/promo-popup";
import { SiteFooter } from "src/features/storefront/shell/site-footer";
import { SiteHeader } from "src/features/storefront/shell/site-header";
import { routing } from "src/i18n/routing";
import { pickLocalized } from "src/lib/localized";
import { StorefrontProviders } from "src/providers/storefront-providers";
import { siteUrl } from "src/server/core/config/env";
import { getSettings } from "src/server/storefront/content.reads";
import "src/styles/storefront.css";

/*
 * One family for both scripts, so switching language does not reflow the
 * page. The reference uses PingARLT, a commercial face; Readex Pro (loaded on
 * the reference too) is the licence-free equivalent.
 */
const storeFont = Readex_Pro({ subsets: ["arabic", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-store", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#91c643" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const settings = await getSettings();
  const name = pickLocalized(settings.storeName, locale);
  const description = pickLocalized(settings.seo.description, locale) || pickLocalized(settings.tagline, locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: pickLocalized(settings.seo.title, locale) || name, template: `%s - ${name}` },
    ...(description ? { description } : {}),
    applicationName: name,
    ...(settings.favicon?.secureUrl ? { icons: { icon: settings.favicon.secureUrl } } : {}),
    openGraph: {
      type: "website",
      siteName: name,
      locale: locale === "ar" ? "ar_SA" : "en_SA",
      ...(settings.logo?.secureUrl ? { images: [{ url: settings.logo.secureUrl }] } : {}),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const dir = LOCALE_DIRECTION[locale as Locale];
  const [settings, t, tc] = await Promise.all([getSettings(), getTranslations("shell"), getTranslations("common")]);

  return (
    <html lang={locale} dir={dir} className={storeFont.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <NextIntlClientProvider>
          <StorefrontProviders dir={dir}>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
              {t("skipToContent")}
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <FloatingActions whatsapp={settings.contact.whatsapp} whatsappLabel={t("whatsapp")} backToTopLabel={t("backToTop")} />
            <PromoPopup popup={settings.popup} locale={locale} closeLabel={tc("close")} dismissLabel={t("popupDismiss")} />
          </StorefrontProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
