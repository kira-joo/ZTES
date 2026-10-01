"use client";

import { categoryCrudEndpoints, type CategoryEntity, type CategoryFormValues } from "src/common/api/admin-categories.endpoints";
import { CustomForm, FieldType, renderFormField, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber } from "src/components/admin/form-number";
import { SlugFields } from "src/components/admin/slug-fields";
import { pickLocalized } from "src/lib/localized";
import { bannerImagePolicy, categoryImagePolicy } from "src/server/core/assets/upload-policies";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(category?: CategoryEntity): CategoryFormValues {
  if (!category) {
    return {
      name: EMPTY_LOCALIZED,
      slug: EMPTY_LOCALIZED,
      description: EMPTY_LOCALIZED,
      parent: null,
      image: null,
      icon: null,
      banner: null,
      sortOrder: 0,
      isActive: true,
      showInMenu: true,
      seo: { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
    };
  }
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    parent: category.parent,
    image: category.image ?? null,
    icon: category.icon ?? null,
    banner: category.banner ?? null,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    showInMenu: category.showInMenu,
    seo: category.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

function toBody(values: CategoryFormValues, form: UseFormReturn<CategoryFormValues>): CategoryFormValues {
  return {
    ...values,
    slug: form.getValues("slug"),
    description: form.getValues("description"),
    parent: values.parent || null,
    sortOrder: toNumber(values.sortOrder),
  };
}

export interface CategoryFormProps {
  category?: CategoryEntity;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CategoryFormValues>({ defaultValues: toFormValues(category) });

  const sections: FormSection<CategoryFormValues>[] = [
    {
      title: "Identity",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "name", label: "Name", rules: { required: "Required" }, colSpan: "full" },
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "parent",
          label: "Parent category",
          description: "Leave empty for a top-level category. Up to three levels deep.",
          endpoint: categoryCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
          optionValue: (item) => (item as unknown as CategoryEntity)._id,
          query: { limit: 100 },
          colSpan: "full",
        },
      ],
    },
    {
      title: "Images",
      fields: [
        { type: FieldType.IMAGE_ASSET, name: "image", label: "Tile image", policy: categoryImagePolicy },
        { type: FieldType.IMAGE_ASSET, name: "icon", label: "Menu icon", policy: categoryImagePolicy },
        { type: FieldType.IMAGE_ASSET, name: "banner", label: "Banner", policy: bannerImagePolicy },
      ],
    },
    {
      title: "Status",
      fields: [
        { type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" },
        { type: FieldType.SWITCH, name: "showInMenu", label: "Show in menu" },
        { type: FieldType.SWITCH, name: "isActive", label: "Active" },
      ],
    },
  ];

  const children = (
    <>
      <PageSection title="Slug">
        <SlugFields control={form.control} setValue={form.setValue} getValues={form.getValues} nameField="name" slugField="slug" />
      </PageSection>
      <PageSection title="Description">
        <FormLocalizedRichText control={form.control} name="description" />
      </PageSection>
      <PageSection title="SEO">
        <div className="grid grid-cols-1 gap-4">
          {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "seo.title", label: "Meta title" }, form)}
          {renderFormField({ type: FieldType.LOCALIZED_TEXTAREA, name: "seo.description", label: "Meta description", rows: 3 }, form)}
        </div>
      </PageSection>
    </>
  );

  const handleSuccess = (saved: CategoryEntity) => {
    toast.success(category ? "Category updated" : "Category created");
    void queryClient.invalidateQueries();
    router.push(`/admin/categories/${saved._id}`);
  };

  if (category) {
    return (
      <CustomForm<CategoryFormValues, typeof categoryCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={categoryCrudEndpoints.update}
        submitParams={{ id: category._id }}
        transformValues={(values) => toBody(values, form)}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<CategoryFormValues, typeof categoryCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={categoryCrudEndpoints.create}
      transformValues={(values) => toBody(values, form)}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
