"use client";

import { faqCrudEndpoints, type FaqEntity } from "api/admin-faqs.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";

export function FaqListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: faqCrudEndpoints.delete });

  const columns: TableColumn<FaqEntity>[] = [
    { key: "question", header: "Question", render: (row) => pickLocalized(row.question, "en") },
    { key: "sortOrder", header: "Order", sortable: true, align: "right" },
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
      title="FAQs"
      description="Answers shown on the storefront's FAQ page and home section."
      actions={
        <RouteButton path="/admin/faqs/new" leftIcon={Plus}>
          Add FAQ
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={faqCrudEndpoints.get}
        columns={columns}
        entityName="FAQ"
        searchPlaceholder="Search questions…"
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/faqs/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete "${pickLocalized(subject.question, "en")}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("FAQ deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
