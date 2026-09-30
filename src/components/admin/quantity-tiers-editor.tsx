"use client";

import { CustomButton, EmptyState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CustomInput } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type ArrayPath, type Control, type FieldValues, type Path } from "react-hook-form";

export interface QuantityTiersEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  /** Path of the `{ minQuantity, percent }[]` field, e.g. `"quantityTiers"`. */
  name: Path<TFieldValues>;
}

/**
 * "Add one more for 10% off" rows. A `useFieldArray`-owned editor rendered
 * outside `CustomForm`'s `sections` (bound to the same externally-owned
 * `form.control`) — see `SocialLinksField` in the reference app for why an
 * array field must own its own registration rather than going through a
 * `FieldType.CUSTOM` config.
 */
export function QuantityTiersEditor<TFieldValues extends FieldValues>({ control, name }: QuantityTiersEditorProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({ control, name: name as unknown as ArrayPath<TFieldValues> });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <EmptyState title="No quantity discounts" description="Add a tier like “buy 3, save 10%”." />
      ) : (
        fields.map((row, index) => (
          <div key={row.id} className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 p-3">
            <Controller
              control={control}
              name={`${name}.${index}.minQuantity` as Path<TFieldValues>}
              rules={{ required: true, min: 2 }}
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Min. quantity"
                  type="number"
                  min={2}
                  wrapperClassName="w-32"
                  error={fieldState.error ? "Required, at least 2" : undefined}
                  {...field}
                  value={(field.value as number | string | undefined) ?? ""}
                />
              )}
            />
            <Controller
              control={control}
              name={`${name}.${index}.percent` as Path<TFieldValues>}
              rules={{ required: true, min: 1, max: 90 }}
              render={({ field, fieldState }) => (
                <CustomInput
                  label="Discount %"
                  type="number"
                  min={1}
                  max={90}
                  wrapperClassName="w-32"
                  error={fieldState.error ? "Required, 1–90" : undefined}
                  {...field}
                  value={(field.value as number | string | undefined) ?? ""}
                />
              )}
            />
            <button
              type="button"
              aria-label={`Remove tier ${index + 1}`}
              onClick={() => remove(index)}
              className="flex size-10 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))
      )}
      <CustomButton
        type="button"
        variant="outline"
        leftIcon={Plus}
        className="self-start"
        onClick={() => append({ minQuantity: 2, percent: 10 } as never)}
      >
        Add tier
      </CustomButton>
    </div>
  );
}
