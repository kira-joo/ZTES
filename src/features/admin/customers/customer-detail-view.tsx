"use client";

import { customerDetailEndpoint } from "api/admin-customers.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { AppLink, Badge, InfoRow, PageSection, PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { formatAmount } from "src/lib/money";
import { pickLocalized } from "src/lib/localized";

export interface CustomerDetailViewProps {
  id: string;
}

export function CustomerDetailView({ id }: CustomerDetailViewProps) {
  const query = useRequesterQuery({ endpoint: customerDetailEndpoint, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? `${query.data.customer.firstName} ${query.data.customer.lastName}` : "Customer"}
      backRoute={{ path: "/admin/customers", label: "Back to customers" }}
    >
      <QueryState query={query} entityName="Customer" backRoute={{ path: "/admin/customers", label: "Back to customers" }}>
        {({ customer, orders }) => (
          <div className="flex flex-col gap-6">
            <PageSection title="Contact">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow label="Phone" value={customer.phone} />
                <InfoRow label="Email" value={customer.email} />
                <InfoRow label="Orders placed" value={String(customer.orderCount)} />
                <InfoRow label="Last order" value={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString("en-SA") : "—"} />
              </div>
            </PageSection>

            {customer.lastAddress && (
              <PageSection title="Last delivery address">
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>{pickLocalized(customer.lastAddress.city, "en")}</span>
                  <span>
                    {customer.lastAddress.district}, {customer.lastAddress.street}
                    {customer.lastAddress.building ? `, ${customer.lastAddress.building}` : ""}
                  </span>
                  {customer.lastAddress.notes && <span className="text-slate-500">{customer.lastAddress.notes}</span>}
                  {customer.lastAddress.mapUrl && (
                    <a href={customer.lastAddress.mapUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      View on map
                    </a>
                  )}
                </div>
              </PageSection>
            )}

            <PageSection title="Order history">
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {orders.map((order) => (
                    <AppLink
                      key={order._id}
                      path="/admin/orders/[orderNumber]"
                      params={{ orderNumber: order.orderNumber }}
                      variant="unstyled"
                      className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-medium">{order.orderNumber}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </span>
                      <span className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{new Date(order.createdAt).toLocaleDateString("en-SA")}</span>
                        <span className="font-medium text-slate-900">{formatAmount(order.pricing.total, "en")} SAR</span>
                      </span>
                    </AppLink>
                  ))}
                </div>
              )}
            </PageSection>
          </div>
        )}
      </QueryState>
    </PageShell>
  );
}
