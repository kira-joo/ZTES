"use client";

import type { StoreSettingsFormValues } from "api/admin-settings.endpoints";
import { CustomButton, EmptyState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CustomInput } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type Control } from "react-hook-form";

export function AnnouncementsEditor({ control }: { control: Control<StoreSettingsFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "announcements" });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <EmptyState title="No announcements" description="Shown in the scrolling bar above the header." />
      ) : (
        fields.map((field, index) => (
          <div key={field.id} className="flex flex-wrap items-end gap-3">
            <Controller
              control={control}
              name={`announcements.${index}.en`}
              render={({ field: f }) => <CustomInput label="English" wrapperClassName="flex-1" {...f} value={f.value ?? ""} />}
            />
            <Controller
              control={control}
              name={`announcements.${index}.ar`}
              render={({ field: f }) => <CustomInput label="Arabic" dir="rtl" wrapperClassName="flex-1" {...f} value={f.value ?? ""} />}
            />
            <button
              type="button"
              aria-label={`Remove announcement ${index + 1}`}
              onClick={() => remove(index)}
              className="flex size-10 items-center justify-center rounded text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))
      )}
      <CustomButton type="button" variant="outline" leftIcon={Plus} className="self-start" onClick={() => append({ ar: "", en: "" })}>
        Add announcement
      </CustomButton>
    </div>
  );
}
