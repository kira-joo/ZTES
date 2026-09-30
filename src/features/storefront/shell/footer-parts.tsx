"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { modalPresentation, useDialog, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { newsletterEndpoint } from "api/storefront-content.endpoints";
import { ArrowUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { ImageAsset } from "src/common/types/storefront";
import { getStorefrontApi } from "src/lib/api-client";

export function NewsletterForm() {
  const t = useTranslations("shell");
  const locale = useLocale() as "ar" | "en";
  const [email, setEmail] = useState("");
  const mutation = useRequesterMutation({ endpoint: newsletterEndpoint, client: getStorefrontApi() });
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await mutation.mutateAsync({ body: { email, locale } });
          setEmail("");
          toast.success(t("subscribed"));
        } catch {
          toast.error(t("subscribeFailed"));
        }
      }}
      className="flex w-full max-w-md overflow-hidden rounded-card border border-line bg-card"
    >
      <input
        type="email"
        required
        dir="ltr"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t("newsletterPlaceholder")}
        aria-label={t("newsletterPlaceholder")}
        className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-muted rtl:text-right"
      />
      <button type="submit" disabled={mutation.isPending} className="bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {t("subscribe")}
      </button>
    </form>
  );
}

function CertificateDialog({ titleId, image, title }: DialogContentProps & { image: ImageAsset; title: string }) {
  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 text-lg font-bold text-ink">
        {title}
      </h2>
      <div className="relative aspect-[3/4] w-full">
        <Image src={image.secureUrl} alt={title} fill sizes="(min-width: 768px) 32rem, 90vw" className="object-contain" />
      </div>
    </div>
  );
}

export function VatCertificateButton({ vatNumber, certificate }: { vatNumber: string; certificate: ImageAsset | null }) {
  const t = useTranslations("shell");
  const { openDialog } = useDialog();
  const content = (
    <>
      <span className="grid size-10 place-items-center rounded-lg bg-brand-deep text-[0.6rem] font-bold leading-tight text-white">VAT</span>
      <span className="text-start">
        <span className="block text-xs text-ink-muted">{t("vatNumber")}</span>
        <span className="block font-semibold tabular-nums text-ink" dir="ltr">
          {vatNumber}
        </span>
      </span>
    </>
  );
  if (!certificate) return <div className="flex items-center gap-3">{content}</div>;
  return (
    <button
      type="button"
      onClick={() =>
        openDialog({ component: CertificateDialog, props: { image: certificate, title: t("vatCertificate") }, presentation: modalPresentation({ size: "lg" }) })
      }
      className="flex items-center gap-3 rounded-card hover:opacity-80"
    >
      {content}
    </button>
  );
}

export function BackToTop() {
  const t = useTranslations("shell");
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className="mx-auto flex items-center gap-2 py-3 text-sm font-medium text-ink-soft hover:text-brand-dark"
    >
      <ArrowUp className="size-4" aria-hidden="true" />
      {t("backToTop")}
    </button>
  );
}
