"use client";

import { orderListEndpoint, type OrderListRow } from "src/common/api/admin-orders.endpoints";
import { FeatureFilterType, FeatureTable, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { Badge, PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatAmount } from "src/lib/money";

const STATUS_OPTIONS = [
  { label: "Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_TONE: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function DateRangeToolbar({ from, to, onChange }: { from: string; to: string; onChange: (value: { from: string; to: string }) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center gap-1.5">
        <span className="text-slate-500">From</span>
        <input
          type="date"
          value={from}
          onChange={(event) => onChange({ from: event.target.value, to })}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-slate-500">To</span>
        <input
          type="date"
          value={to}
          onChange={(event) => onChange({ from, to: event.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
      </label>
    </div>
  );
}

export function OrderListView() {
  const router = useRouter();
  const [range, setRange] = useState({ from: "", to: "" });

  const columns: TableColumn<OrderListRow>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1.5 font-medium">
          {row.orderNumber}
          {row.contactMismatch && <AlertTriangle className="size-3.5 text-amber-500" aria-label="Contact mismatch" />}
        </span>
      ),
    },
    { key: "createdAt", header: "Date", sortable: true, render: (row) => new Date(row.createdAt).toLocaleString("en-SA") },
    {
      key: "contact",
      header: "Customer",
      render: (row) => (
        <span className="flex flex-col">
          <span>
            {row.contact.firstName} {row.contact.lastName}
          </span>
          <span className="text-xs text-slate-500">{row.contact.phone}</span>
        </span>
      ),
    },
    { key: "pricing", header: "Total", sortable: true, render: (row) => `${formatAmount(row.pricing.total, "en")} SAR` },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge className={STATUS_TONE[row.status]}>{STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status}</Badge>,
    },
  ];

  return (
    <PageShell title="Orders" description="Every order placed on the storefront.">
      <FeatureTable
        endpoint={orderListEndpoint}
        columns={columns}
        entityName="Order"
        searchPlaceholder="Search by order number…"
        query={range.from || range.to ? { from: range.from || undefined, to: range.to || undefined } : undefined}
        toolbar={<DateRangeToolbar from={range.from} to={range.to} onChange={setRange} />}
        filters={[
          { type: FeatureFilterType.SELECT, key: "status", header: "Status", options: STATUS_OPTIONS },
          {
            type: FeatureFilterType.SELECT,
            key: "contactMismatch",
            header: "Contact",
            options: [{ label: "Mismatched only", value: "true" }],
          },
        ]}
        onRowClick={(row) => router.push(`/admin/orders/${row.orderNumber}`)}
        bordered={false}
      />
    </PageShell>
  );
}
