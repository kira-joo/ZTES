"use client";

import { homeSectionCrudEndpoints } from "api/admin-home-sections.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { HomeSectionForm } from "src/features/admin/home-sections/home-section-form";

export default function EditHomeSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: homeSectionCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell title="Edit home section" backRoute={{ path: "/admin/home-sections", label: "Back to home sections" }}>
      <QueryState query={query} entityName="Home section" backRoute={{ path: "/admin/home-sections", label: "Back to home sections" }}>
        {(section) => <HomeSectionForm section={section} />}
      </QueryState>
    </PageShell>
  );
}
