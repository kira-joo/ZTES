"use client";

import { brandCrudEndpoints, type BrandEntity } from "api/admin-brands.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureFilterType, FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";

export function BrandListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: brandCrudEndpoints.delete });

  const columns: TableColumn<BrandEntity>[] = [
    {
      key: "logo",
      header: "Logo",
      render: (row) =>
        row.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small admin thumbnail, not an optimized page asset
          <img src={row.logo.secureUrl} alt="" className="size-10 rounded object-contain" />
        ) : (
          <div className="size-10 rounded bg-slate-100" aria-hidden="true" />
        ),
    },
    { key: "name", header: "Name", sortable: true, render: (row) => pickLocalized(row.name, "en") },
    { key: "slug", header: "Slug", render: (row) => row.slug.en },
    { key: "sortOrder", header: "Order", sortable: true, align: "right" },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Brands"
      description="Manufacturers and labels shown across the catalog."
      actions={
        <RouteButton path="/admin/brands/new" leftIcon={Plus}>
          Add brand
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={brandCrudEndpoints.get}
        columns={columns}
        entityName="Brand"
        searchPlaceholder="Search brands…"
        filters={[
          {
            type: FeatureFilterType.SELECT,
            key: "isActive",
            header: "Status",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/brands/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({
              title: `Delete "${pickLocalized(subject.name, "en")}"?`,
              description: "This cannot be undone.",
              destructive: true,
            }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("Brand deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
