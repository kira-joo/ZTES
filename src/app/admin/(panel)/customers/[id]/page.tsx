"use client";

import { use } from "react";
import { CustomerDetailView } from "src/features/admin/customers/customer-detail-view";

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CustomerDetailView id={id} />;
}
