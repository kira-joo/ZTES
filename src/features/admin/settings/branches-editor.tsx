"use client";

import type { StoreSettingsFormValues } from "api/admin-settings.endpoints";
import { CustomButton, EmptyState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CustomInput } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type Control } from "react-hook-form";

function LocalizedPair({ control, basePath, label }: { control: Control<StoreSettingsFormValues>; basePath: string; label: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Controller
        control={control}
        name={`${basePath}.en` as never}
        render={({ field }) => <CustomInput label={`${label} (English)`} {...field} value={(field.value as string) ?? ""} />}
      />
      <Controller
        control={control}
        name={`${basePath}.ar` as never}
        render={({ field }) => <CustomInput label={`${label} (Arabic)`} dir="rtl" {...field} value={(field.value as string) ?? ""} />}
      />
    </div>
  );
}

export function BranchesEditor({ control }: { control: Control<StoreSettingsFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "branches" });

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && <EmptyState title="No branches yet" description="Shown on the storefront's branch-map section." />}
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <LocalizedPair control={control} basePath={`branches.${index}.name`} label="Name" />
            </div>
            <button
              type="button"
              aria-label={`Remove branch ${index + 1}`}
              onClick={() => remove(index)}
              className="flex size-9 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <LocalizedPair control={control} basePath={`branches.${index}.address`} label="Address" />
          <LocalizedPair control={control} basePath={`branches.${index}.hours`} label="Hours" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Controller
              control={control}
              name={`branches.${index}.phone`}
              render={({ field }) => <CustomInput label="Phone" {...field} value={field.value ?? ""} />}
            />
            <Controller
              control={control}
              name={`branches.${index}.mapUrl`}
              render={({ field }) => <CustomInput label="Map URL" {...field} value={field.value ?? ""} />}
            />
            <Controller
              control={control}
              name={`branches.${index}.mapEmbedUrl`}
              render={({ field }) => <CustomInput label="Map embed URL" {...field} value={field.value ?? ""} />}
            />
          </div>
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
            address: { ar: "", en: "" },
            hours: { ar: "", en: "" },
            phone: "",
            mapUrl: "",
            mapEmbedUrl: "",
          })
        }
      >
        Add branch
      </CustomButton>
    </div>
  );
}
