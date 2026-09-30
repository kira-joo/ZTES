"use client";

import { pageCrudEndpoints } from "api/admin-pages.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { PageForm } from "src/features/admin/pages/page-form";
import { pickLocalized } from "src/lib/localized";

export default function EditStaticPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: pageCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.title, "en") : "Edit page"}
      backRoute={{ path: "/admin/pages", label: "Back to pages" }}
    >
      <QueryState query={query} entityName="Page" backRoute={{ path: "/admin/pages", label: "Back to pages" }}>
        {(page) => <PageForm page={page} />}
      </QueryState>
    </PageShell>
  );
}
