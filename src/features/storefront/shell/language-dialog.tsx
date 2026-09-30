"use client";

import type { DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "src/i18n/navigation";
import { useAlternatePaths, type AlternatePaths } from "./alternate-links";

/** The reference's language modal. Keeps the current page, on its other-locale slug when known. */
export function LanguageDialog({ titleId, alternates }: DialogContentProps & { alternates: AlternatePaths | null }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const pathname = usePathname();
  const options = [
    { code: "ar", label: t("arabic") },
    { code: "en", label: t("english") },
  ] as const;

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 text-lg font-bold text-ink">
        {t("chooseLanguage")}
      </h2>
      <ul className="grid gap-2">
        {options.map((option) => {
          const path = alternates?.[option.code] ?? pathname;
          const active = option.code === locale;
          return (
            <li key={option.code}>
              {/* A full navigation: the layout's <html lang/dir> must change with it. */}
              <a
                href={`/${option.code}${path === "/" ? "" : path}`}
                hrefLang={option.code}
                lang={option.code}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-12 items-center justify-between rounded-card border px-4 font-semibold ${
                  active ? "border-brand bg-brand-soft text-brand-deep" : "border-line text-ink hover:border-brand"
                }`}
              >
                {option.label}
                {active ? <Check className="size-4" aria-hidden="true" /> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function useLanguageAlternates() {
  return useAlternatePaths();
}
