"use client";

import { ChevronLeft, ChevronRight, Globe, Headphones, Link2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { CategoryNode } from "src/common/types/storefront";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";

export interface MenuData {
  categories: CategoryNode[];
  pages: { title: string; href: string }[];
  contact: { phone: string; whatsapp: string; email: string };
}

type Level = { title: string; items: MenuItem[] };
type MenuItem = { key: string; label: string; href?: string; icon?: ReactNode; children?: Level };

/**
 * The reference's menu: one drill-down list for every screen size — tap a
 * parent to slide into its children, "back" to return. Top level: the pest
 * library, the category tree, brands, useful links, customer service, language.
 */
export function MenuDrawer({ data, onNavigate, onLanguage }: { data: MenuData; onNavigate: () => void; onLanguage: () => void }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const Forward = isRtl ? ChevronLeft : ChevronRight;
  const Backward = isRtl ? ChevronRight : ChevronLeft;

  const toItem = (node: CategoryNode): MenuItem => {
    const name = pickLocalized(node.name, locale);
    const href = `/categories/${pickSlug(node.slug, locale)}`;
    const icon = node.icon?.secureUrl ? (
      <Image src={node.icon.secureUrl} alt="" width={22} height={22} className="size-5.5 object-contain" />
    ) : undefined;
    const children = node.children.filter((child) => child.showInMenu);
    return {
      key: node._id,
      label: name,
      href,
      icon,
      children: children.length
        ? { title: name, items: [{ key: `${node._id}-all`, label: t("allIn", { name }), href }, ...children.map(toItem)] }
        : undefined,
    };
  };

  const root: Level = {
    title: t("mainMenu"),
    items: [
      ...data.categories.filter((node) => node.showInMenu).map(toItem),
      { key: "brands", label: t("brands"), href: "/brands" },
      { key: "offers", label: t("offers"), href: "/offers" },
      {
        key: "links",
        label: t("usefulLinks"),
        icon: <Link2 className="size-5 text-ink-muted" aria-hidden="true" />,
        children: { title: t("usefulLinks"), items: data.pages.map((page) => ({ key: page.href, label: page.title, href: page.href })) },
      },
      {
        key: "service",
        label: t("customerService"),
        icon: <Headphones className="size-5 text-ink-muted" aria-hidden="true" />,
        children: {
          title: t("customerService"),
          items: [
            ...(data.contact.whatsapp ? [{ key: "wa", label: `${t("whatsapp")} · ${data.contact.whatsapp}`, href: `https://wa.me/${data.contact.whatsapp.replace(/\D/g, "")}` }] : []),
            ...(data.contact.phone ? [{ key: "tel", label: `${t("phone")} · ${data.contact.phone}`, href: `tel:${data.contact.phone}` }] : []),
            ...(data.contact.email ? [{ key: "mail", label: `${t("email")} · ${data.contact.email}`, href: `mailto:${data.contact.email}` }] : []),
          ],
        },
      },
    ],
  };

  const [stack, setStack] = useState<Level[]>([root]);
  const level = stack[stack.length - 1]!;

  return (
    <nav aria-label={t("mainMenu")} className="flex min-h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line pe-12 ps-4">
        {stack.length > 1 ? (
          <button
            type="button"
            onClick={() => setStack((current) => current.slice(0, -1))}
            className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <Backward className="size-4" aria-hidden="true" />
            {t("back")}
          </button>
        ) : null}
        <p className="truncate text-sm text-ink-muted">{level.title}</p>
      </div>
      <ul key={stack.length} className="store-reveal flex-1 divide-y divide-line px-3 py-2">
        {level.items.map((item) => (
          <li key={item.key}>
            {item.children ? (
              <button
                type="button"
                onClick={() => setStack((current) => [...current, item.children!])}
                className="flex min-h-12 w-full items-center gap-3 px-2 text-start text-[0.95rem] font-semibold text-ink hover:text-brand-dark"
              >
                {item.icon ?? <span className="size-5" aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
                <Forward className="size-4 text-ink-muted" aria-hidden="true" />
              </button>
            ) : item.href?.startsWith("/") ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                className="flex min-h-12 items-center gap-3 px-2 text-[0.95rem] font-semibold text-ink hover:text-brand-dark"
              >
                {item.icon ?? <span className="size-5" aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
              </Link>
            ) : (
              <a
                href={item.href}
                className="flex min-h-12 items-center gap-3 px-2 text-[0.95rem] font-semibold text-ink hover:text-brand-dark"
                dir="auto"
              >
                <span className="size-5" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
              </a>
            )}
          </li>
        ))}
        {stack.length === 1 ? (
          <li>
            <button
              type="button"
              onClick={onLanguage}
              className="flex min-h-12 w-full items-center gap-3 px-2 text-start text-[0.95rem] font-semibold text-ink hover:text-brand-dark"
            >
              <Globe className="size-5 text-ink-muted" aria-hidden="true" />
              <span className="flex-1">{t("language")}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
