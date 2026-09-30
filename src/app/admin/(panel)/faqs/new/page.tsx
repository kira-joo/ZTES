"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { FaqForm } from "src/features/admin/faqs/faq-form";

export default function NewFaqPage() {
  return (
    <PageShell title="Add FAQ" backRoute={{ path: "/admin/faqs", label: "Back to FAQs" }}>
      <FaqForm />
    </PageShell>
  );
}
