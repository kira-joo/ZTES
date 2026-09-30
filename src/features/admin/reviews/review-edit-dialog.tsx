"use client";

import type { ReviewEntity } from "api/admin-reviews.endpoints";
import { DialogBody, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { ReviewForm } from "./review-form";

export type ReviewEditDialogProps = DialogContentProps<void> & { review: ReviewEntity };

/** The `openDialog` component for moderating one review from the list, without a `GET /reviews/:id` route. */
export function ReviewEditDialog({ review, resolve, titleId, descriptionId }: ReviewEditDialogProps) {
  return (
    <DialogBody titleId={titleId} descriptionId={descriptionId} title="Edit review">
      <ReviewForm review={review} onSaved={() => resolve()} />
    </DialogBody>
  );
}
