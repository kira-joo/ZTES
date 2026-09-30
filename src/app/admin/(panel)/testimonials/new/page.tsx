"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { TestimonialForm } from "src/features/admin/testimonials/testimonial-form";

export default function NewTestimonialPage() {
  return (
    <PageShell title="Add testimonial" backRoute={{ path: "/admin/testimonials", label: "Back to testimonials" }}>
      <TestimonialForm />
    </PageShell>
  );
}
