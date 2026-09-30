"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CategoryForm } from "src/features/admin/categories/category-form";

export default function NewCategoryPage() {
  return (
    <PageShell title="Add category" backRoute={{ path: "/admin/categories", label: "Back to categories" }}>
      <CategoryForm />
    </PageShell>
  );
}
