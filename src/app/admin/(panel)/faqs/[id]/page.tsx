"use client";

import { faqCrudEndpoints } from "api/admin-faqs.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { FaqForm } from "src/features/admin/faqs/faq-form";
import { pickLocalized } from "src/lib/localized";

export default function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: faqCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.question, "en") : "Edit FAQ"}
      backRoute={{ path: "/admin/faqs", label: "Back to FAQs" }}
    >
      <QueryState query={query} entityName="FAQ" backRoute={{ path: "/admin/faqs", label: "Back to FAQs" }}>
        {(faq) => <FaqForm faq={faq} />}
      </QueryState>
    </PageShell>
  );
}
