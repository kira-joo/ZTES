"use client";

import { use } from "react";
import { OrderDetailView } from "src/features/admin/orders/order-detail-view";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  return <OrderDetailView orderNumber={orderNumber} />;
}
