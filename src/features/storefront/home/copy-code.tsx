"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** The reference's copyable coupon box. */
export function CopyCode({ code }: { code: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border-2 border-dashed border-brand bg-brand-soft p-2 ps-4">
      <span className="text-lg font-extrabold tracking-[0.2em] text-brand-deep" dir="ltr">
        {code}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-card bg-brand-deep px-4 text-sm font-semibold text-white"
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
