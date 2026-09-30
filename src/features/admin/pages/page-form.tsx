"use client";

import { pageCrudEndpoints, type PageEntity, type PageFormValues } from "api/admin-pages.endpoints";
import { CustomForm, FieldType, renderFormField, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber } from "src/components/admin/form-number";
import { SlugFields } from "src/components/admin/slug-fields";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(page?: PageEntity): PageFormValues {
  if (!page) {
    return {
      title: EMPTY_LOCALIZED,
      slug: EMPTY_LOCALIZED,
      body: EMPTY_LOCALIZED,
      isActive: true,
      showInFooter: true,
      sortOrder: 0,
      seo: { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
    };
  }
  return {
    title: page.title,
    slug: page.slug,
    body: page.body,
    isActive: page.isActive,
    showInFooter: page.showInFooter,
    sortOrder: page.sortOrder,
    seo: page.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

function toBody(values: PageFormValues, form: UseFormReturn<PageFormValues>): PageFormValues {
  return { ...values, slug: form.getValues("slug"), body: form.getValues("body"), sortOrder: toNumber(values.sortOrder) };
}

export interface PageFormProps {
  page?: PageEntity;
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<PageFormValues>({ defaultValues: toFormValues(page) });

  const sections: FormSection<PageFormValues>[] = [
    {
      title: "Title",
      fields: [{ type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title", rules: { required: "Required" }, colSpan: "full" }],
    },
    {
      title: "Status",
      fields: [
        { type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" },
        { type: FieldType.SWITCH, name: "showInFooter", label: "Show in footer" },
        { type: FieldType.SWITCH, name: "isActive", label: "Active" },
      ],
    },
  ];

  const children = (
    <>
      <PageSection title="Slug">
        <SlugFields control={form.control} setValue={form.setValue} getValues={form.getValues} nameField="title" slugField="slug" />
      </PageSection>
      <PageSection title="Body">
        <FormLocalizedRichText control={form.control} name="body" />
      </PageSection>
      <PageSection title="SEO">
        <div className="grid grid-cols-1 gap-4">
          {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "seo.title", label: "Meta title" }, form)}
          {renderFormField({ type: FieldType.LOCALIZED_TEXTAREA, name: "seo.description", label: "Meta description", rows: 3 }, form)}
        </div>
      </PageSection>
    </>
  );

  const handleSuccess = (saved: PageEntity) => {
    toast.success(page ? "Page updated" : "Page created");
    void queryClient.invalidateQueries();
    router.push(`/admin/pages/${saved._id}`);
  };

  if (page) {
    return (
      <CustomForm<PageFormValues, typeof pageCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={pageCrudEndpoints.update}
        submitParams={{ id: page._id }}
        transformValues={(values) => toBody(values, form)}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<PageFormValues, typeof pageCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={pageCrudEndpoints.create}
      transformValues={(values) => toBody(values, form)}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
