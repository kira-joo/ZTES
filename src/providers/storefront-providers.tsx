"use client";

import { ToolkitProviders, createToolkitQueryClient } from "@kira-joo/frontend-toolkit-core";
import { DirectionProvider } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { DialogProvider } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { Toaster } from "@kira-joo/frontend-toolkit-tailwind";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { AlternateLinksProvider } from "src/features/storefront/shell/alternate-links";

/**
 * Client-side providers for the storefront: React Query (the cart cache),
 * Radix direction (without it Radix stamps dir="ltr" inside an RTL page),
 * the dialog stack (menu drawer, search, quick view, language), toasts, and the
 * per-page alternate-language links the language switcher follows.
 */
export function StorefrontProviders({ dir, children }: { dir: "rtl" | "ltr"; children: ReactNode }) {
  const [client] = useState(() => createToolkitQueryClient());
  const t = useTranslations("common");
  return (
    <ToolkitProviders client={client}>
      <DirectionProvider dir={dir}>
        <DialogProvider
          labels={{ close: t("close"), confirm: "OK", cancel: t("close"), save: "OK", fallbackMessage: "" }}
        >
          <AlternateLinksProvider>{children}</AlternateLinksProvider>
          <Toaster />
        </DialogProvider>
      </DirectionProvider>
    </ToolkitProviders>
  );
}
