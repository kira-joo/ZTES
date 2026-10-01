"use client";

import { categoryCrudEndpoints } from "src/common/api/admin-categories.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { CategoryForm } from "src/features/admin/categories/category-form";
import { pickLocalized } from "src/lib/localized";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: categoryCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.name, "en") : "Edit category"}
      backRoute={{ path: "/admin/categories", label: "Back to categories" }}
    >
      <QueryState query={query} entityName="Category" backRoute={{ path: "/admin/categories", label: "Back to categories" }}>
        {(category) => <CategoryForm category={category} />}
      </QueryState>
    </PageShell>
  );
}
