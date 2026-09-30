"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { RichTextEditor } from "./rich-text-editor";

export interface FormLocalizedRichTextProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  /** Base path, e.g. `"description"` — bound to `${name}.en` / `${name}.ar`. */
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Rich-text counterpart to the toolkit's `FormLocalizedTextarea` — same
 * side-by-side English/Arabic layout (Arabic rendered `dir="rtl"`), but for
 * sanitised-HTML fields (product/category/brand descriptions, page and post
 * bodies, FAQ answers) that the toolkit has no field type for.
 */
export function FormLocalizedRichText<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormLocalizedRichTextProps<TFieldValues>) {
  return (
    <div className={className}>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      {description && <span className="mb-1.5 block text-xs text-slate-500">{description}</span>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          control={control}
          name={`${name}.en` as Path<TFieldValues>}
          render={({ field }) => (
            <div>
              <span className="mb-1 block text-xs font-medium tracking-wide text-slate-400">ENGLISH</span>
              <RichTextEditor
                value={(field.value as string) ?? ""}
                onChange={field.onChange}
                dir="ltr"
                disabled={disabled}
                aria-label={`${label ?? name} (English)`}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name={`${name}.ar` as Path<TFieldValues>}
          render={({ field }) => (
            <div>
              <span className="mb-1 block text-xs font-medium tracking-wide text-slate-400">ARABIC</span>
              <RichTextEditor
                value={(field.value as string) ?? ""}
                onChange={field.onChange}
                dir="rtl"
                disabled={disabled}
                aria-label={`${label ?? name} (Arabic)`}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
