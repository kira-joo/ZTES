"use client";

import { useTranslations } from "next-intl";
import type { ProductDetailView } from "src/common/types/storefront";
import { StoreImage } from "src/components/store/store-image";
import { pickLocalized } from "src/lib/localized";
import { formatAmount } from "src/lib/money";
import { ProductOptionType } from "src/common/enums";

/**
 * The product's option groups: THUMBNAIL renders image tiles, TEXT renders
 * pills. Unavailable values are visible but disabled. `missingGroupIds` draws
 * the "required" validation state after a failed add-to-cart attempt.
 */
export function ProductOptions({
  options,
  selected,
  onSelect,
  missingGroupIds,
  locale,
}: {
  options: ProductDetailView["options"];
  selected: Record<string, string>;
  onSelect: (groupId: string, valueId: string) => void;
  missingGroupIds: string[];
  locale: string;
}) {
  const t = useTranslations("product.options");
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {options.map((group) => {
        const groupName = pickLocalized(group.name, locale);
        const isMissing = missingGroupIds.includes(group._id);
        const selectedValueId = selected[group._id];
        return (
          <fieldset key={group._id}>
            <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              {groupName}
              {group.required ? <span className="text-xs font-normal text-ink-muted">({t("required")})</span> : null}
            </legend>
            {group.type === ProductOptionType.THUMBNAIL ? (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={groupName} aria-required={group.required}>
                {group.values.map((value) => {
                  const label = pickLocalized(value.label, locale);
                  const active = selectedValueId === value._id;
                  return (
                    <button
                      key={value._id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={!value.isAvailable}
                      onClick={() => onSelect(group._id, value._id)}
                      title={value.isAvailable ? label : `${label} (${t("unavailable")})`}
                      className={`relative size-16 overflow-hidden rounded-card border-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        active ? "border-brand" : "border-line hover:border-brand-light"
                      }`}
                    >
                      <StoreImage image={value.image} alt={label} sizes="64px" />
                      {!value.isAvailable ? (
                        <span className="absolute inset-0 bg-card/70" aria-hidden="true">
                          <span className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink-muted" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={groupName} aria-required={group.required}>
                {group.values.map((value) => {
                  const label = pickLocalized(value.label, locale);
                  const active = selectedValueId === value._id;
                  const delta = Number(value.priceDelta);
                  return (
                    <button
                      key={value._id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={!value.isAvailable}
                      onClick={() => onSelect(group._id, value._id)}
                      className={`min-h-10 rounded-full border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                        active ? "border-brand bg-brand text-white" : "border-line bg-card text-ink hover:border-brand"
                      }`}
                    >
                      {label}
                      {delta !== 0 ? (
                        <span className={`ms-1 ${active ? "text-white/80" : "text-ink-muted"}`}>
                          ({delta > 0 ? "+" : ""}
                          {formatAmount(value.priceDelta, locale)})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
            {isMissing ? <p className="mt-1.5 text-xs font-medium text-sale">{t("selectRequired", { group: groupName })}</p> : null}
          </fieldset>
        );
      })}
    </div>
  );
}
