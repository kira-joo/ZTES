"use client";

import { couponCrudEndpoints, type CouponEntity } from "src/common/api/admin-coupons.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureFilterType, FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { formatAmount } from "src/lib/money";

export function CouponListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: couponCrudEndpoints.delete });

  const columns: TableColumn<CouponEntity>[] = [
    { key: "code", header: "Code", sortable: true, render: (row) => <span className="font-mono">{row.code}</span> },
    {
      key: "value",
      header: "Value",
      render: (row) => (row.type === "PERCENT" ? `${row.value}%` : `${formatAmount(row.value, "en")} SAR`),
    },
    { key: "minSubtotal", header: "Min subtotal", render: (row) => (row.minSubtotal ? `${formatAmount(row.minSubtotal, "en")} SAR` : "—") },
    { key: "usedCount", header: "Used", align: "right", render: (row) => `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ""}` },
    { key: "endsAt", header: "Ends", render: (row) => (row.endsAt ? new Date(row.endsAt).toLocaleDateString("en-SA") : "—") },
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
      title="Coupons"
      description="Discount codes customers can apply at checkout."
      actions={
        <RouteButton path="/admin/coupons/new" leftIcon={Plus}>
          Add coupon
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={couponCrudEndpoints.get}
        columns={columns}
        entityName="Coupon"
        searchPlaceholder="Search by code…"
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
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/coupons/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete coupon "${subject.code}"?`, description: "This cannot be undone.", destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("Coupon deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
