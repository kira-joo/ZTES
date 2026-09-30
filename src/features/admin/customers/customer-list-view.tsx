"use client";

import { customerListEndpoint, type CustomerEntity } from "api/admin-customers.endpoints";
import { FeatureTable, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useRouter } from "next/navigation";

export function CustomerListView() {
  const router = useRouter();

  const columns: TableColumn<CustomerEntity>[] = [
    { key: "firstName", header: "Name", sortable: true, render: (row) => `${row.firstName} ${row.lastName}` },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "orderCount", header: "Orders", align: "right", sortable: true },
    { key: "lastOrderAt", header: "Last order", render: (row) => (row.lastOrderAt ? new Date(row.lastOrderAt).toLocaleDateString("en-SA") : "—") },
  ];

  return (
    <PageShell title="Customers" description="Guests matched by phone or email across orders.">
      <FeatureTable
        endpoint={customerListEndpoint}
        columns={columns}
        entityName="Customer"
        searchPlaceholder="Search by name, phone or email…"
        onRowClick={(row) => router.push(`/admin/customers/${row._id}`)}
        bordered={false}
      />
    </PageShell>
  );
}
