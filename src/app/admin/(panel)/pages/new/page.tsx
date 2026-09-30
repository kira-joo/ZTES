"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { PageForm } from "src/features/admin/pages/page-form";

export default function NewStaticPagePage() {
  return (
    <PageShell title="Add page" backRoute={{ path: "/admin/pages", label: "Back to pages" }}>
      <PageForm />
    </PageShell>
  );
}
