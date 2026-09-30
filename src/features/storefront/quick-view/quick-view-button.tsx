"use client";

import { modalPresentation, useDialog } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { Eye } from "lucide-react";
import { QuickViewBody } from "./quick-view-dialog";

/**
 * The product card's quick-view control.
 *
 * CONTRACT used by the product card: `<QuickViewButton productId slug label />`.
 */
export function QuickViewButton({ productId, label }: { productId: string; slug: string; label: string }) {
  const { openDialog } = useDialog();
  return (
    <button
      type="button"
      onClick={() => openDialog({ component: QuickViewBody, props: { productId }, presentation: modalPresentation({ size: "lg" }) })}
      aria-label={label}
      aria-haspopup="dialog"
      className="grid size-9 place-items-center rounded-full bg-card text-ink shadow-card transition hover:text-brand-dark"
    >
      <Eye className="size-4" aria-hidden="true" />
    </button>
  );
}
