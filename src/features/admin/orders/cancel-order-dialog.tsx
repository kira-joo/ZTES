"use client";

import { DialogBody, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { CustomButton } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CustomTextarea } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { useState } from "react";

export type CancelOrderDialogProps = DialogContentProps<string> & { orderNumber: string };

/** Cancelling always asks why — the reason lands in the order's timeline. */
export function CancelOrderDialog({ orderNumber, resolve, dismiss, titleId, descriptionId }: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <DialogBody
      titleId={titleId}
      descriptionId={descriptionId}
      title={`Cancel order ${orderNumber}?`}
      description="This restocks the order's lines and cannot be undone."
      actions={
        <>
          <CustomButton type="button" variant="outline" onClick={dismiss}>
            Keep order
          </CustomButton>
          <CustomButton type="button" variant="destructive" disabled={reason.trim().length === 0} onClick={() => resolve(reason.trim())}>
            Cancel order
          </CustomButton>
        </>
      }
    >
      <CustomTextarea
        label="Reason"
        required
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="e.g. Customer requested cancellation"
      />
    </DialogBody>
  );
}
