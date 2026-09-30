"use client";

import { useTranslations } from "next-intl";

/** The required safe-use acknowledgement. Controlled: parent owns persistence (see `use-safe-use.ts`). */
export function SafeUseCheckbox({
  title,
  text,
  checked,
  onChange,
  showRequiredError = false,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  showRequiredError?: boolean;
}) {
  const t = useTranslations("cart.safeUse");
  if (!title && !text) return null;

  return (
    <div className={`rounded-card border bg-card p-4 shadow-card ${showRequiredError ? "border-sale" : "border-line"}`}>
      {text ? <div className="rich-text mb-3 max-h-32 overflow-y-auto text-xs text-ink-soft" dangerouslySetInnerHTML={{ __html: text }} /> : null}
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-brand"
        />
        <span>{t("checkboxLabel", { title })}</span>
      </label>
      {showRequiredError ? <p className="mt-1.5 text-xs font-medium text-sale">{t("required")}</p> : null}
    </div>
  );
}
