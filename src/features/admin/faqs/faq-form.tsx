"use client";

import { faqCrudEndpoints, type FaqEntity, type FaqFormValues } from "api/admin-faqs.endpoints";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber } from "src/components/admin/form-number";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(faq?: FaqEntity): FaqFormValues {
  if (!faq) return { question: EMPTY_LOCALIZED, answer: EMPTY_LOCALIZED, sortOrder: 0, isActive: true };
  return { question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive };
}

export interface FaqFormProps {
  faq?: FaqEntity;
}

export function FaqForm({ faq }: FaqFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FaqFormValues>({ defaultValues: toFormValues(faq) });

  const sections: FormSection<FaqFormValues>[] = [
    {
      title: "Question",
      fields: [{ type: FieldType.LOCALIZED_INPUT, name: "question", label: "Question", rules: { required: "Required" }, colSpan: "full" }],
    },
    {
      title: "Status",
      fields: [
        { type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" },
        { type: FieldType.SWITCH, name: "isActive", label: "Active" },
      ],
    },
  ];

  const children = (
    <PageSection title="Answer">
      <FormLocalizedRichText control={form.control} name="answer" />
    </PageSection>
  );

  const transformValues = (values: FaqFormValues): FaqFormValues => ({
    ...values,
    answer: form.getValues("answer"),
    sortOrder: toNumber(values.sortOrder),
  });

  const handleSuccess = (saved: FaqEntity) => {
    toast.success(faq ? "FAQ updated" : "FAQ created");
    void queryClient.invalidateQueries();
    router.push(`/admin/faqs/${saved._id}`);
  };

  if (faq) {
    return (
      <CustomForm<FaqFormValues, typeof faqCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={faqCrudEndpoints.update}
        submitParams={{ id: faq._id }}
        transformValues={transformValues}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<FaqFormValues, typeof faqCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={faqCrudEndpoints.create}
      transformValues={transformValues}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
