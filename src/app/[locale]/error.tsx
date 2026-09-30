"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("content");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-4 py-24 text-center">
      <TriangleAlert className="size-16 text-sale" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-ink">{t("errorTitle")}</h1>
      <p className="text-ink-soft">{t("errorBody")}</p>
      <button type="button" onClick={reset} className="mt-2 rounded-card bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
        {useTranslations("common")("retry")}
      </button>
    </div>
  );
}
