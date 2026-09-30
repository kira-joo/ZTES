"use client";

import { testimonialCrudEndpoints, type TestimonialEntity, type TestimonialFormValues } from "api/admin-testimonials.endpoints";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toNumber } from "src/components/admin/form-number";
import { contentImagePolicy } from "src/server/core/assets/upload-policies";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(testimonial?: TestimonialEntity): TestimonialFormValues {
  if (!testimonial) return { authorName: "", body: EMPTY_LOCALIZED, rating: 5, avatar: null, sortOrder: 0, isActive: true };
  return {
    authorName: testimonial.authorName,
    body: testimonial.body,
    rating: testimonial.rating,
    avatar: testimonial.avatar ?? null,
    sortOrder: testimonial.sortOrder,
    isActive: testimonial.isActive,
  };
}

function toBody(values: TestimonialFormValues): TestimonialFormValues {
  return { ...values, rating: toNumber(values.rating, 5), sortOrder: toNumber(values.sortOrder) };
}

export interface TestimonialFormProps {
  testimonial?: TestimonialEntity;
}

export function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<TestimonialFormValues>({ defaultValues: toFormValues(testimonial) });

  const sections: FormSection<TestimonialFormValues>[] = [
    {
      title: "Testimonial",
      fields: [
        { type: FieldType.INPUT, name: "authorName", label: "Author name", rules: { required: "Required" } },
        { type: FieldType.INPUT, name: "rating", label: "Rating (1–5)", inputType: "number", rules: { required: "Required", min: 1, max: 5 } },
        { type: FieldType.LOCALIZED_TEXTAREA, name: "body", label: "Quote", rules: { required: "Required" }, colSpan: "full", rows: 4 },
        { type: FieldType.IMAGE_ASSET, name: "avatar", label: "Avatar", policy: contentImagePolicy, colSpan: "full" },
      ],
    },
    {
      title: "Status",
      fields: [
        { type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" },
        { type: FieldType.SWITCH, name: "isActive", label: "Active" },
      ],
    },
  ];

  const handleSuccess = (saved: TestimonialEntity) => {
    toast.success(testimonial ? "Testimonial updated" : "Testimonial created");
    void queryClient.invalidateQueries();
    router.push(`/admin/testimonials/${saved._id}`);
  };

  if (testimonial) {
    return (
      <CustomForm<TestimonialFormValues, typeof testimonialCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={testimonialCrudEndpoints.update}
        submitParams={{ id: testimonial._id }}
        transformValues={toBody}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      />
    );
  }

  return (
    <CustomForm<TestimonialFormValues, typeof testimonialCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={testimonialCrudEndpoints.create}
      transformValues={toBody}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    />
  );
}
