"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { BrandForm } from "src/features/admin/brands/brand-form";

export default function NewBrandPage() {
  return (
    <PageShell title="Add brand" backRoute={{ path: "/admin/brands", label: "Back to brands" }}>
      <BrandForm />
    </PageShell>
  );
}
