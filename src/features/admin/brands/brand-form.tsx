"use client";

import { brandCrudEndpoints, type BrandEntity, type BrandFormValues } from "api/admin-brands.endpoints";
import { CustomForm, FieldType, renderFormField, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber } from "src/components/admin/form-number";
import { SlugFields } from "src/components/admin/slug-fields";
import { logoImagePolicy } from "src/server/core/assets/upload-policies";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(brand?: BrandEntity): BrandFormValues {
  if (!brand) {
    return {
      name: EMPTY_LOCALIZED,
      slug: EMPTY_LOCALIZED,
      logo: null,
      description: EMPTY_LOCALIZED,
      sortOrder: 0,
      isActive: true,
      seo: { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
    };
  }
  return {
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo ?? null,
    description: brand.description,
    sortOrder: brand.sortOrder,
    isActive: brand.isActive,
    seo: brand.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

/**
 * `slug`/`description` are localized composites with their own nested
 * Controllers (see `FormLocalizedRichText`/`SlugFields`) — declaring them as
 * toolkit `sections` fields would additionally register the same path
 * through `CustomForm`'s own `FieldType.CUSTOM` Controller, which is the
 * "same path twice under two different mechanisms" bug the workspace has hit
 * before (see `SocialLinksField` in the reference app). They render as
 * `CustomForm`'s `children` instead, bound to the same externally-owned
 * `form.control`, and are re-added to the submission here — `transformValues`
 * still closes over the live `form`, so nothing declared is lost.
 */
function toBody(values: BrandFormValues, form: UseFormReturn<BrandFormValues>): BrandFormValues {
  return {
    ...values,
    slug: form.getValues("slug"),
    description: form.getValues("description"),
    sortOrder: toNumber(values.sortOrder),
  };
}

export interface BrandFormProps {
  brand?: BrandEntity;
}

/** Shared create/edit form for `/admin/brands/new` and `/admin/brands/[id]`. */
export function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<BrandFormValues>({ defaultValues: toFormValues(brand) });

  const sections: FormSection<BrandFormValues>[] = [
    {
      title: "Identity",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "name", label: "Name", rules: { required: "Required" }, colSpan: "full" },
        { type: FieldType.IMAGE_ASSET, name: "logo", label: "Logo", policy: logoImagePolicy, colSpan: "full" },
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
      <PageSection title="Status">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {renderFormField({ type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" }, form)}
          {renderFormField({ type: FieldType.SWITCH, name: "isActive", label: "Active" }, form)}
        </div>
      </PageSection>
    </>
  );

  const handleSuccess = (saved: BrandEntity) => {
    toast.success(brand ? "Brand updated" : "Brand created");
    void queryClient.invalidateQueries();
    router.push(`/admin/brands/${saved._id}`);
  };

  if (brand) {
    return (
      <CustomForm<BrandFormValues, typeof brandCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={brandCrudEndpoints.update}
        submitParams={{ id: brand._id }}
        transformValues={(values) => toBody(values, form)}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<BrandFormValues, typeof brandCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={brandCrudEndpoints.create}
      transformValues={(values) => toBody(values, form)}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
