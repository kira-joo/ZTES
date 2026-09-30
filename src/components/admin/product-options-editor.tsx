"use client";

import { CustomButton, EmptyState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CustomCheckbox, CustomInput } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { CustomSelect } from "@kira-joo/frontend-toolkit-tailwind/select";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type ArrayPath, type Control, type FieldValues, type Path } from "react-hook-form";

const OPTION_TYPE_OPTIONS = [
  { label: "Thumbnail (image tiles)", value: "THUMBNAIL" },
  { label: "Text", value: "TEXT" },
];

interface LocalizedTextPairProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  basePath: string;
  label: string;
}

function LocalizedTextPair<TFieldValues extends FieldValues>({ control, basePath, label }: LocalizedTextPairProps<TFieldValues>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Controller
        control={control}
        name={`${basePath}.en` as Path<TFieldValues>}
        rules={{ required: "Required" }}
        render={({ field, fieldState }) => (
          <CustomInput label={`${label} (English)`} error={fieldState.error?.message} {...field} value={(field.value as string) ?? ""} />
        )}
      />
      <Controller
        control={control}
        name={`${basePath}.ar` as Path<TFieldValues>}
        rules={{ required: "Required" }}
        render={({ field, fieldState }) => (
          <CustomInput label={`${label} (Arabic)`} dir="rtl" error={fieldState.error?.message} {...field} value={(field.value as string) ?? ""} />
        )}
      />
    </div>
  );
}

interface OptionValuesEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  optionsPath: string;
  groupIndex: number;
}

function OptionValuesEditor<TFieldValues extends FieldValues>({ control, optionsPath, groupIndex }: OptionValuesEditorProps<TFieldValues>) {
  const valuesPath = `${optionsPath}.${groupIndex}.values`;
  const { fields, append, remove, move } = useFieldArray({ control, name: valuesPath as unknown as ArrayPath<TFieldValues> });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <EmptyState title="No values yet" description="Add at least one value for this option." />
      ) : (
        fields.map((value, valueIndex) => (
          <div key={value.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <LocalizedTextPair control={control} basePath={`${valuesPath}.${valueIndex}.label`} label="Label" />
            <div className="flex flex-wrap items-end gap-3">
              <Controller
                control={control}
                name={`${valuesPath}.${valueIndex}.priceDelta` as Path<TFieldValues>}
                render={({ field }) => (
                  <CustomInput label="Price delta" placeholder="0.00" wrapperClassName="w-32" {...field} value={(field.value as string) ?? ""} />
                )}
              />
              <Controller
                control={control}
                name={`${valuesPath}.${valueIndex}.isAvailable` as Path<TFieldValues>}
                render={({ field }) => (
                  <CustomCheckbox
                    label="Available"
                    checked={(field.value as boolean) ?? true}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Move value up"
                  disabled={valueIndex === 0}
                  onClick={() => move(valueIndex, valueIndex - 1)}
                  className="flex size-9 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Move value down"
                  disabled={valueIndex === fields.length - 1}
                  onClick={() => move(valueIndex, valueIndex + 1)}
                  className="flex size-9 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Remove value"
                  onClick={() => remove(valueIndex)}
                  className="flex size-9 items-center justify-center rounded text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              An image per value is not supported here yet — the backend has no upload path for option-value images.
            </p>
          </div>
        ))
      )}
      <CustomButton
        type="button"
        variant="outline"
        size="sm"
        leftIcon={Plus}
        className="self-start"
        onClick={() => append({ label: { ar: "", en: "" }, priceDelta: "0", isAvailable: true, sortOrder: fields.length } as never)}
      >
        Add value
      </CustomButton>
    </div>
  );
}

export interface ProductOptionsEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  /** Path of the option-groups array field, e.g. `"options"`. */
  name: Path<TFieldValues>;
}

/**
 * Option groups (Size, Color, ...) each with their own values — a
 * `useFieldArray`-of-`useFieldArray`s editor, rendered outside `CustomForm`'s
 * `sections` for the same reason `SlugFields`/`FormLocalizedRichText` are:
 * it owns nested array registrations no `FieldType.CUSTOM` config could
 * safely wrap.
 */
export function ProductOptionsEditor<TFieldValues extends FieldValues>({ control, name }: ProductOptionsEditorProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({ control, name: name as unknown as ArrayPath<TFieldValues> });

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && <EmptyState title="No option groups" description="Add one for size, color, or similar choices." />}
      {fields.map((group, groupIndex) => (
        <div key={group.id} className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <GripVertical className="mt-2 size-4 shrink-0 text-slate-300" aria-hidden="true" />
            <div className="flex-1">
              <LocalizedTextPair control={control} basePath={`${name}.${groupIndex}.name`} label="Group name" />
            </div>
            <button
              type="button"
              aria-label={`Remove group ${groupIndex + 1}`}
              onClick={() => remove(groupIndex)}
              className="flex size-9 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <Controller
              control={control}
              name={`${name}.${groupIndex}.type` as Path<TFieldValues>}
              render={({ field }) => (
                <CustomSelect
                  label="Type"
                  options={OPTION_TYPE_OPTIONS}
                  value={(field.value as string) ?? "TEXT"}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
            <Controller
              control={control}
              name={`${name}.${groupIndex}.required` as Path<TFieldValues>}
              render={({ field }) => (
                <CustomCheckbox
                  label="Required"
                  checked={(field.value as boolean) ?? true}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              )}
            />
          </div>
          <OptionValuesEditor control={control} optionsPath={name} groupIndex={groupIndex} />
        </div>
      ))}
      <CustomButton
        type="button"
        variant="outline"
        leftIcon={Plus}
        className="self-start"
        onClick={() =>
          append({
            name: { ar: "", en: "" },
            type: "TEXT",
            required: true,
            values: [],
          } as never)
        }
      >
        Add option group
      </CustomButton>
    </div>
  );
}
