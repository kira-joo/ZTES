"use client";

import { testimonialCrudEndpoints, type TestimonialEntity } from "api/admin-testimonials.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";

export function TestimonialListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: testimonialCrudEndpoints.delete });

  const columns: TableColumn<TestimonialEntity>[] = [
    {
      key: "avatar",
      header: "",
      render: (row) =>
        row.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
          <img src={row.avatar.secureUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <div className="size-9 rounded-full bg-slate-100" aria-hidden="true" />
        ),
    },
    { key: "authorName", header: "Author", sortable: true },
    { key: "body", header: "Testimonial", render: (row) => <span className="line-clamp-2 max-w-md text-slate-600">{pickLocalized(row.body, "en")}</span> },
    {
      key: "rating",
      header: "Rating",
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          {row.rating} <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Testimonials"
      description="Customer quotes shown in the testimonials home section."
      actions={
        <RouteButton path="/admin/testimonials/new" leftIcon={Plus}>
          Add testimonial
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={testimonialCrudEndpoints.get}
        columns={columns}
        entityName="Testimonial"
        searchPlaceholder="Search by author…"
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/testimonials/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete testimonial from "${subject.authorName}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("Testimonial deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
