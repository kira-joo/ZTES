"use client";

import { testimonialCrudEndpoints } from "api/admin-testimonials.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { TestimonialForm } from "src/features/admin/testimonials/testimonial-form";

export default function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: testimonialCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? query.data.authorName : "Edit testimonial"}
      backRoute={{ path: "/admin/testimonials", label: "Back to testimonials" }}
    >
      <QueryState query={query} entityName="Testimonial" backRoute={{ path: "/admin/testimonials", label: "Back to testimonials" }}>
        {(testimonial) => <TestimonialForm testimonial={testimonial} />}
      </QueryState>
    </PageShell>
  );
}
