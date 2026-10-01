import { Banknote, Mail, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { WhatsAppIcon } from "src/components/store/whatsapp-icon";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getCategoryTree } from "src/server/storefront/catalog.reads";
import { getPages, getSettings } from "src/server/storefront/content.reads";
import { NewsletterForm, VatCertificateButton } from "./footer-parts";
import { SocialIcons } from "./social-icons";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations("shell");
  const [settings, categories, pages] = await Promise.all([getSettings(), getCategoryTree(), getPages()]);
  const storeName = pickLocalized(settings.storeName, locale);
  const whatsapp = settings.contact.whatsapp.replace(/\D/g, "");

  const links = [
    ...categories.slice(0, 4).map((category) => ({
      label: pickLocalized(category.name, locale),
      href: `/categories/${pickSlug(category.slug, locale)}`,
    })),
    ...pages.filter((page) => page.showInFooter).map((page) => ({
      label: pickLocalized(page.title, locale),
      href: `/pages/${pickSlug(page.slug, locale)}`,
    })),
    { label: t("wishlist"), href: "/wishlist" },
    { label: t("offers"), href: "/offers" },
  ];

  return (
    <footer className="mt-16 bg-card">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex flex-col gap-6 border-b border-line py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div>
              <p className="text-lg font-bold text-ink">{t("newsletterTitle")}</p>
              <p className="text-sm text-ink-soft">{t("newsletterSubtitle")}</p>
            </div>
            <NewsletterForm />
          </div>
          <SocialIcons social={settings.social} />
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            {settings.logo?.secureUrl ? (
              <Image src={settings.logo.secureUrl} alt={storeName} width={settings.logo.width || 160} height={settings.logo.height || 40} className="h-9 w-auto" />
            ) : (
              <p className="text-xl font-extrabold text-brand-dark">{storeName}</p>
            )}
            <p className="text-sm leading-7 text-ink-soft">{pickLocalized(settings.footerDescription, locale).replace(/<[^>]+>/g, "")}</p>
          </div>

          <nav aria-label={t("usefulLinks")}>
            <p className="mb-3 font-bold text-brand-dark">{t("usefulLinks")}</p>
            <ul className="grid gap-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-soft hover:text-brand-dark">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 font-bold text-brand-dark">{t("customerService")}</p>
            <ul className="flex flex-wrap gap-2">
              {whatsapp ? (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")} className="grid size-12 place-items-center rounded-card bg-band text-ink hover:bg-brand hover:text-white">
                    <WhatsAppIcon className="size-5" />
                  </a>
                </li>
              ) : null}
              {settings.contact.phone ? (
                <li>
                  <a href={`tel:${settings.contact.phone}`} aria-label={`${t("phone")} ${settings.contact.phone}`} className="grid size-12 place-items-center rounded-card bg-band text-ink hover:bg-brand hover:text-white">
                    <Phone className="size-5" aria-hidden="true" />
                  </a>
                </li>
              ) : null}
              {settings.contact.email ? (
                <li>
                  <a href={`mailto:${settings.contact.email}`} aria-label={`${t("email")} ${settings.contact.email}`} className="grid size-12 place-items-center rounded-card bg-band text-ink hover:bg-brand hover:text-white">
                    <Mail className="size-5" aria-hidden="true" />
                  </a>
                </li>
              ) : null}
            </ul>
            <div className="mt-4 space-y-1 text-sm text-ink-soft">
              {settings.contact.phone ? <p dir="ltr" className="rtl:text-right">{settings.contact.phone}</p> : null}
              {settings.contact.email ? <p dir="ltr" className="rtl:text-right">{settings.contact.email}</p> : null}
            </div>
            <address className="mt-4 space-y-1 text-sm not-italic leading-6 text-ink-soft">
              <p className="font-semibold text-ink">
                <bdi lang="ar">{pickLocalized(settings.legal.companyName, locale)}</bdi>
              </p>
              <p>{pickLocalized(settings.contact.address, locale)}</p>
              {settings.contact.shortAddress ? (
                <p>
                  {t("shortAddress")}: <span className="font-semibold text-ink" dir="ltr">{settings.contact.shortAddress}</span>
                </p>
              ) : null}
            </address>
          </div>

          <div className="space-y-5">
            {settings.legal.vatNumber ? <VatCertificateButton vatNumber={settings.legal.vatNumber} certificate={settings.legal.vatCertificate} /> : null}
            {settings.legal.crNumber ? (
              <p className="text-sm text-ink-soft">
                {t("crNumber")}: <span className="font-semibold tabular-nums text-ink" dir="ltr">{settings.legal.crNumber}</span>
              </p>
            ) : null}
            {(settings.appLinks.appStore || settings.appLinks.googlePlay) ? (
              <div className="flex gap-2 text-sm">
                {settings.appLinks.appStore ? <a href={settings.appLinks.appStore} className="rounded-card border border-line px-3 py-2 hover:border-brand">App Store</a> : null}
                {settings.appLinks.googlePlay ? <a href={settings.appLinks.googlePlay} className="rounded-card border border-line px-3 py-2 hover:border-brand">Google Play</a> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-line py-5 text-sm text-ink-soft md:flex-row md:justify-between">
          <p>{t("rights", { year: new Date().getFullYear(), name: storeName })}</p>
          <p className="flex items-center gap-2" aria-label={t("paymentMethods")}>
            <span className="inline-flex items-center gap-2 rounded-card border border-line px-3 py-1.5 font-medium text-ink">
              <Banknote className="size-4 text-brand-dark" aria-hidden="true" />
              {t("cashOnDelivery")}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
