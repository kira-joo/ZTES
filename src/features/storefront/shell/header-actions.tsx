"use client";

import { drawerPresentation, modalPresentation, useDialog } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { Heart, Menu, Search, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "src/features/storefront/cart/use-cart";
import { useWishlist } from "src/features/storefront/wishlist/use-wishlist";
import { Link } from "src/i18n/navigation";
import { useAlternatePaths } from "./alternate-links";
import { LanguageDialog } from "./language-dialog";
import { MenuDrawer, type MenuData } from "./menu-drawer";
import { SearchDialog, type SearchSuggestions } from "./search-dialog";

function useShellDialogs(menu: MenuData, suggestions: SearchSuggestions) {
  const { openDialog, closeDialog } = useDialog();
  const alternates = useAlternatePaths();

  const openLanguage = () =>
    openDialog({ component: LanguageDialog, props: { alternates }, presentation: modalPresentation({ size: "sm" }) });

  const openMenu = () =>
    openDialog({
      component: MenuDrawer,
      props: { data: menu, onNavigate: () => closeDialog(), onLanguage: () => { closeDialog(); openLanguage(); } },
      presentation: drawerPresentation({ side: "inline-start", className: "store-drawer-start" }),
    });

  const openSearch = () =>
    openDialog({ component: SearchDialog, props: { suggestions }, presentation: modalPresentation({ size: "full", className: "bg-canvas" }) });

  return { openMenu, openSearch, openLanguage };
}

export function MenuButton({ menu, suggestions }: { menu: MenuData; suggestions: SearchSuggestions }) {
  const t = useTranslations("shell");
  const { openMenu } = useShellDialogs(menu, suggestions);
  return (
    <button
      type="button"
      onClick={openMenu}
      aria-label={t("menu")}
      aria-haspopup="dialog"
      className="flex min-h-11 items-center gap-2 text-ink hover:text-brand-dark"
    >
      <Menu className="size-6 text-brand" aria-hidden="true" />
      {/* The visible label hides below `sm`; `aria-label` above keeps the
          button's accessible name from disappearing along with it. */}
      <span className="hidden text-base font-semibold sm:inline" aria-hidden="true">
        {t("menu")}
      </span>
    </button>
  );
}

export function HeaderActions({ menu, suggestions }: { menu: MenuData; suggestions: SearchSuggestions }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const { openSearch, openLanguage } = useShellDialogs(menu, suggestions);
  const { cart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const count = cart?.itemCount ?? 0;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={openLanguage}
        className="hidden min-h-11 items-center px-1 text-sm text-ink hover:text-brand-dark md:flex"
        aria-haspopup="dialog"
      >
        {t("languageLabel", { name: locale === "ar" ? t("arabic") : t("english") })}
      </button>
      <button type="button" onClick={openSearch} aria-label={t("search")} className="grid size-11 place-items-center text-ink hover:text-brand-dark">
        <Search className="size-5" aria-hidden="true" />
      </button>
      <Link href="/wishlist" aria-label={t("wishlist")} className="relative grid size-11 place-items-center text-ink hover:text-brand-dark">
        <Heart className="size-5" aria-hidden="true" />
        {wishlistCount > 0 ? (
          <span className="absolute end-1 top-1.5 grid min-w-4 place-items-center rounded-full bg-sale px-1 text-[0.625rem] font-bold leading-4 text-white">
            {wishlistCount}
          </span>
        ) : null}
      </Link>
      <Link href="/cart" aria-label={t("cartCount", { count })} className="relative grid size-11 place-items-center text-ink hover:text-brand-dark">
        <ShoppingCart className="size-5" aria-hidden="true" />
        <span className="absolute end-1 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-4 text-white">
          {count}
        </span>
      </Link>
    </div>
  );
}
