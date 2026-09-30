"use client";

import { pageCrudEndpoints, type PageEntity } from "api/admin-pages.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";

export function PageListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: pageCrudEndpoints.delete });

  const columns: TableColumn<PageEntity>[] = [
    { key: "title", header: "Title", sortable: true, render: (row) => pickLocalized(row.title, "en") },
    { key: "slug", header: "Slug", render: (row) => row.slug.en },
    { key: "showInFooter", header: "In footer", render: (row) => (row.showInFooter ? "Yes" : "No") },
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
      title="Static pages"
      description="Standalone pages such as terms, privacy and about."
      actions={
        <RouteButton path="/admin/pages/new" leftIcon={Plus}>
          Add page
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={pageCrudEndpoints.get}
        columns={columns}
        entityName="Page"
        searchPlaceholder="Search pages…"
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/pages/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete "${pickLocalized(subject.title, "en")}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("Page deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
