"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { HomeSectionForm } from "src/features/admin/home-sections/home-section-form";

export default function NewHomeSectionPage() {
  return (
    <PageShell title="Add home section" backRoute={{ path: "/admin/home-sections", label: "Back to home sections" }}>
      <HomeSectionForm />
    </PageShell>
  );
}
