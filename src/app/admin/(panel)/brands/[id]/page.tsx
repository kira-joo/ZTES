"use client";

import { brandCrudEndpoints } from "api/admin-brands.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { BrandForm } from "src/features/admin/brands/brand-form";
import { pickLocalized } from "src/lib/localized";

export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: brandCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.name, "en") : "Edit brand"}
      backRoute={{ path: "/admin/brands", label: "Back to brands" }}
    >
      <QueryState query={query} entityName="Brand" backRoute={{ path: "/admin/brands", label: "Back to brands" }}>
        {(brand) => <BrandForm brand={brand} />}
      </QueryState>
    </PageShell>
  );
}
