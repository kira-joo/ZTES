"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

/** Web Share API when available (mobile browsers), falling back to copy-link. */
export function ProductShareButton({ title, url }: { title: string; url: string }) {
  const t = useTranslations("product.share");

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* the user cancelled the native share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={t("label")}
      className="flex h-10 items-center gap-2 rounded-card border border-line px-3 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand-dark"
    >
      <Share2 className="size-4" aria-hidden="true" />
      {t("label")}
    </button>
  );
}
