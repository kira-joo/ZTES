"use client";

import { dashboardEndpoint } from "api/admin-dashboard.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { ActionableList, BarChart, ChartCard, KpiCard } from "@kira-joo/frontend-toolkit-tailwind/charts";
import { AppLink, PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { AlertTriangle, PackageX, ShoppingCart, Users2 } from "lucide-react";
import { OrderStatus } from "src/common/enums";
import { formatAmount } from "src/lib/money";
import { pickLocalized } from "src/lib/localized";

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: "Placed",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.OUT_FOR_DELIVERY]: "Out for delivery",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
};

export function DashboardView() {
  const query = useRequesterQuery({ endpoint: dashboardEndpoint });

  return (
    <PageShell title="Dashboard" description="Today at a glance.">
      <QueryState query={query} entityName="Dashboard">
        {(data) => (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Orders today" value={data.ordersToday} icon={ShoppingCart} />
              <KpiCard label="Orders this week" value={data.ordersThisWeek} icon={ShoppingCart} />
              <KpiCard
                label="Delivered revenue (7d)"
                value={Number(data.deliveredRevenueThisWeek)}
                format={() => formatAmount(data.deliveredRevenueThisWeek, "en") + " SAR"}
                icon={Users2}
              />
              <KpiCard
                label="Contact mismatches"
                value={data.contactMismatches}
                state={data.contactMismatches > 0 ? "warning" : "neutral"}
                icon={AlertTriangle}
              />
            </div>

            <ChartCard title="Orders by status">
              <BarChart
                data={Object.values(OrderStatus).map((status) => ({
                  label: STATUS_LABEL[status],
                  value: data.ordersByStatus[status] ?? 0,
                }))}
              />
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ActionableList
                title="Low stock"
                description="Tracked products at or below 5 units."
                items={data.lowStock}
                emptyTitle="Nothing low on stock"
                keyFor={(row) => row._id}
                actions={
                  <span className="text-sm text-slate-500">
                    <PackageX className="mr-1 inline size-4" aria-hidden="true" />
                    {data.lowStock.length}
                  </span>
                }
                renderItem={(row) => (
                  <AppLink
                    path="/admin/products/[id]"
                    params={{ id: row._id }}
                    variant="unstyled"
                    className="flex items-center justify-between gap-3 py-2 hover:text-slate-900"
                  >
                    <span className="truncate">{pickLocalized(row.name, "en")}</span>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {row.stock} left
                    </span>
                  </AppLink>
                )}
              />

              <ActionableList
                title="Latest orders"
                items={data.latestOrders}
                emptyTitle="No orders yet"
                keyFor={(row) => row._id}
                renderItem={(row) => (
                  <AppLink
                    path="/admin/orders/[orderNumber]"
                    params={{ orderNumber: row.orderNumber }}
                    variant="unstyled"
                    className="flex items-center justify-between gap-3 py-2 hover:text-slate-900"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{row.orderNumber}</span>
                      <span className="text-xs text-slate-500">
                        {row.contact.firstName} {row.contact.lastName}
                      </span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span>{formatAmount(row.pricing.total, "en")} SAR</span>
                      <span className="text-xs text-slate-500">{STATUS_LABEL[row.status]}</span>
                    </span>
                  </AppLink>
                )}
              />
            </div>
          </div>
        )}
      </QueryState>
    </PageShell>
  );
}
