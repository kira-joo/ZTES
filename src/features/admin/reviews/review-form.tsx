"use client";

import { reviewUpdateEndpoint, type ReviewEntity, type ReviewUpdateBody } from "api/admin-reviews.endpoints";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toNumber } from "src/components/admin/form-number";
import { pickLocalized } from "src/lib/localized";

export interface ReviewFormProps {
  review: ReviewEntity;
  /**
   * There is no `GET /reviews/:id` route — reviews are moderated inline from
   * the list, which already holds the full row, so this edits a dialog-passed
   * copy rather than a page re-fetching one.
   */
  onSaved: () => void;
}

/** Moderation only — reviews are written by buyers or imported; the admin never creates one. */
export function ReviewForm({ review, onSaved }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<ReviewUpdateBody>({
    defaultValues: {
      authorName: review.authorName,
      rating: review.rating,
      body: review.body,
      isPublished: review.isPublished,
    },
  });

  const sections: FormSection<ReviewUpdateBody>[] = [
    {
      fields: [
        { type: FieldType.INPUT, name: "authorName", label: "Author name", rules: { required: "Required" } },
        { type: FieldType.INPUT, name: "rating", label: "Rating (1–5)", inputType: "number", rules: { required: "Required", min: 1, max: 5 } },
        { type: FieldType.TEXTAREA, name: "body", label: "Review text", colSpan: "full", rows: 5 },
        { type: FieldType.SWITCH, name: "isPublished", label: "Published" },
      ],
      description:
        typeof review.product === "string"
          ? undefined
          : `For "${pickLocalized(review.product.name, "en")}", left ${new Date(review.reviewedAt).toLocaleDateString("en-SA")}.`,
    },
  ];

  return (
    <CustomForm<ReviewUpdateBody, typeof reviewUpdateEndpoint>
      form={form}
      mode="edit"
      sections={sections}
      submitEndpoint={reviewUpdateEndpoint}
      submitParams={{ id: review._id }}
      transformValues={(values) => ({ ...values, rating: toNumber(values.rating, review.rating) })}
      onSuccess={() => {
        toast.success("Review updated");
        void queryClient.invalidateQueries();
        onSaved();
      }}
      warnOnUnsavedChanges
    />
  );
}
