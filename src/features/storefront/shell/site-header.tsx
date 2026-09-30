import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { getCategoryTree } from "src/server/storefront/catalog.reads";
import { getPages, getSearchSuggestions, getSettings } from "src/server/storefront/content.reads";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderActions, MenuButton } from "./header-actions";

/**
 * Announcement marquee, then a sticky three-zone bar: menu (start), centred
 * logo, language/search/wishlist/cart (end). Like the reference there is no
 * inline navigation — the menu drawer is the navigation at every width.
 */
export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations("shell");
  const [settings, categories, pages, suggestions] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    getPages(),
    getSearchSuggestions(),
  ]);
  const storeName = pickLocalized(settings.storeName, locale);
  const menu = {
    categories,
    pages: pages.map((page) => ({ title: pickLocalized(page.title, locale), href: `/pages/${pickSlug(page.slug, locale)}` })),
    contact: settings.contact,
  };

  return (
    <>
      <AnnouncementBar messages={settings.announcements.map((line) => pickLocalized(line, locale)).filter(Boolean)} closeLabel={t("closeAnnouncement")} />
      <header className="sticky top-0 z-30 border-b border-line/60 bg-band/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-3 md:h-[72px] md:px-4">
          <div className="justify-self-start">
            <MenuButton menu={menu} suggestions={suggestions} />
          </div>
          <Link href="/" className="flex items-center justify-self-center" aria-label={storeName}>
            {settings.logo?.secureUrl ? (
              <Image
                src={settings.logo.secureUrl}
                alt={storeName}
                width={settings.logo.width || 160}
                height={settings.logo.height || 40}
                priority
                className="h-8 w-auto md:h-9"
              />
            ) : (
              <span className="text-xl font-extrabold text-brand-dark md:text-2xl">{storeName}</span>
            )}
          </Link>
          <div className="justify-self-end">
            <HeaderActions menu={menu} suggestions={suggestions} />
          </div>
        </div>
      </header>
    </>
  );
}
