"use client";

import { FormInput } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { Wand2 } from "lucide-react";
import type { Control, FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { slugifyEnglish, slugifyLocalized } from "./slug";

export interface SlugFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  /** Base path of the `{ ar, en }` name field this slug is generated from, e.g. `"name"`. */
  nameField: string;
  /** Base path of the `{ ar, en }` slug field, e.g. `"slug"`. */
  slugField: string;
  disabled?: boolean;
}

/**
 * The two localized slug inputs plus a "generate from name" helper —
 * shared by every entity with a `{ ar, en }` slug (products, categories,
 * brands, pages, posts). Generation mirrors the server's own slug pattern
 * exactly (`slugifyEnglish`/`slugifyLocalized`), so a generated value never
 * fails validation.
 */
export function SlugFields<TFieldValues extends FieldValues>({
  control,
  setValue,
  getValues,
  nameField,
  slugField,
  disabled,
}: SlugFieldsProps<TFieldValues>) {
  const handleGenerate = () => {
    const values = getValues() as Record<string, unknown>;
    const name = (values[nameField] as { ar?: string; en?: string } | undefined) ?? {};
    setValue(`${slugField}.en` as Path<TFieldValues>, slugifyEnglish(name.en ?? "") as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`${slugField}.ar` as Path<TFieldValues>, slugifyLocalized(name.ar ?? "") as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={handleGenerate}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb] disabled:opacity-50"
        >
          <Wand2 className="size-3.5" aria-hidden="true" />
          Generate from name
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          control={control}
          name={`${slugField}.en` as Path<TFieldValues>}
          label="Slug (English)"
          rules={{ required: "Required" }}
          disabled={disabled}
        />
        <FormInput
          control={control}
          name={`${slugField}.ar` as Path<TFieldValues>}
          label="Slug (Arabic)"
          dir="rtl"
          rules={{ required: "Required" }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
