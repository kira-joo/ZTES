"use client";

import { orderDetailEndpoint, orderTransitionEndpoint, type OrderDetail } from "api/admin-orders.endpoints";
import { useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { useConfirm, useDialog, modalPresentation } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import {
  AppLink,
  Badge,
  CustomButton,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  Timeline,
  toast,
  type TimelineItem,
} from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Gift, MapPin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAmount } from "src/lib/money";
import { pickLocalized } from "src/lib/localized";
import { CancelOrderDialog } from "./cancel-order-dialog";
import type { OrderStatus } from "src/common/enums";

const STATUS_LABEL: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const TRANSITION_LABEL: Record<string, string> = {
  CONFIRMED: "Confirm order",
  OUT_FOR_DELIVERY: "Mark out for delivery",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
};

const ACTOR_LABEL: Record<string, string> = { ADMIN: "Admin", CUSTOMER: "Customer", SYSTEM: "System" };

export interface OrderDetailViewProps {
  orderNumber: string;
}

export function OrderDetailView({ orderNumber }: OrderDetailViewProps) {
  const query = useRequesterQuery({ endpoint: orderDetailEndpoint, options: { params: { orderNumber } } });
  const transitionMutation = useRequesterMutation({ endpoint: orderTransitionEndpoint });
  const { confirm } = useConfirm();
  const { openDialog } = useDialog();
  const queryClient = useQueryClient();

  const runTransition = async (status: OrderStatus, note?: string) => {
    await transitionMutation.mutateAsync({ params: { orderNumber }, body: { status, note } });
    toast.success(`Order marked ${STATUS_LABEL[status]?.toLowerCase() ?? status}`);
    void queryClient.invalidateQueries();
    query.refetch();
  };

  const handleTransitionClick = async (status: OrderStatus) => {
    if (status === "CANCELLED") {
      openDialog<typeof CancelOrderDialog, string>({
        component: CancelOrderDialog,
        props: { orderNumber },
        presentation: modalPresentation({ size: "md" }),
        onSettled: (outcome) => {
          if (outcome.status === "resolved") void runTransition("CANCELLED" as OrderStatus, outcome.value);
        },
      });
      return;
    }
    const confirmed = await confirm({ title: `${TRANSITION_LABEL[status]}?`, confirmLabel: TRANSITION_LABEL[status] });
    if (confirmed) void runTransition(status);
  };

  return (
    <PageShell title={`Order ${orderNumber}`} backRoute={{ path: "/admin/orders", label: "Back to orders" }}>
      <QueryState query={query} entityName="Order" backRoute={{ path: "/admin/orders", label: "Back to orders" }}>
        {(order: OrderDetail) => {
          const timelineItems: TimelineItem[] = order.timeline.map((entry, index) => ({
            id: `${entry.status}-${index}`,
            content: (
              <div className="flex flex-col">
                <span className="font-medium">{STATUS_LABEL[entry.status] ?? entry.status}</span>
                <span className="text-xs text-slate-500">
                  {new Date(entry.at).toLocaleString("en-SA")} · {ACTOR_LABEL[entry.actor] ?? entry.actor}
                </span>
                {entry.note && <span className="text-sm text-slate-600">{entry.note}</span>}
              </div>
            ),
          }));

          return (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
                  {order.contactMismatch && <Badge className="bg-amber-100 text-amber-800">Contact mismatch</Badge>}
                  <span className="text-sm text-slate-500">Placed {new Date(order.createdAt).toLocaleString("en-SA")}</span>
                </div>
                <div className="flex gap-2">
                  {order.allowedTransitions.map((status) => (
                    <CustomButton
                      key={status}
                      variant={status === "CANCELLED" ? "destructive" : "default"}
                      loading={transitionMutation.loading}
                      onClick={() => handleTransitionClick(status)}
                    >
                      {TRANSITION_LABEL[status] ?? status}
                    </CustomButton>
                  ))}
                </div>
              </div>

              <PageSection title="Items">
                <div className="flex flex-col divide-y divide-slate-100">
                  {order.lines.map((line, index) => (
                    <div key={index} className="flex items-center gap-4 py-3">
                      {line.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- order snapshot image
                        <img src={line.imageUrl} alt="" className="size-14 shrink-0 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{pickLocalized(line.name, "en")}</p>
                        {line.sku && <p className="text-xs text-slate-400">SKU {line.sku}</p>}
                        {line.selectedOptions.length > 0 && (
                          <p className="text-xs text-slate-500">
                            {line.selectedOptions.map((option) => `${pickLocalized(option.group, "en")}: ${pickLocalized(option.value, "en")}`).join(", ")}
                          </p>
                        )}
                        {line.tierPercent > 0 && <p className="text-xs text-emerald-700">{line.tierPercent}% quantity discount applied</p>}
                      </div>
                      <div className="text-right">
                        <p>
                          {formatAmount(line.unitPrice, "en")} SAR × {line.quantity}
                        </p>
                        <p className="font-medium">{formatAmount(line.lineTotal, "en")} SAR</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PageSection>

              <PageSection title="Pricing">
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{formatAmount(order.pricing.subtotal, "en")} SAR</span>
                  </div>
                  {order.coupon && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Coupon ({order.coupon.code})</span>
                      <span>-{formatAmount(order.pricing.couponDiscount, "en")} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span>{formatAmount(order.pricing.shippingFee, "en")} SAR</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold">
                    <span>Total</span>
                    <span>{formatAmount(order.pricing.total, "en")} SAR</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Includes VAT ({order.pricing.vatRate}%)</span>
                    <span>{formatAmount(order.pricing.vatIncluded, "en")} SAR</span>
                  </div>
                </div>
              </PageSection>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <PageSection title="Contact">
                  <div className="flex flex-col gap-2">
                    <InfoRow label="Name" value={`${order.contact.firstName} ${order.contact.lastName}`} />
                    <InfoRow label="Phone" value={order.contact.phone} />
                    <InfoRow label="Email" value={order.contact.email} />
                    <InfoRow label="Payment" value="Cash on delivery" />
                    {typeof order.customer !== "string" && (
                      <AppLink path="/admin/customers/[id]" params={{ id: order.customer._id }} className="mt-1 text-sm">
                        View customer profile →
                      </AppLink>
                    )}
                  </div>
                </PageSection>

                <PageSection title="Delivery address" icon={MapPin}>
                  <div className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>{pickLocalized(order.deliveryAddress.city, "en")}</span>
                    <span>
                      {order.deliveryAddress.district}, {order.deliveryAddress.street}
                      {order.deliveryAddress.building ? `, ${order.deliveryAddress.building}` : ""}
                    </span>
                    {order.deliveryAddress.notes && <span className="text-slate-500">{order.deliveryAddress.notes}</span>}
                    {order.deliveryAddress.mapUrl && (
                      <a href={order.deliveryAddress.mapUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        View on map
                      </a>
                    )}
                  </div>
                </PageSection>

                {order.gift && (
                  <PageSection title="Gift" icon={Gift}>
                    <div className="flex flex-col gap-1 text-sm text-slate-700">
                      <InfoRow label="From" value={order.gift.senderName} />
                      <InfoRow label="To" value={`${order.gift.recipientName} (${order.gift.recipientPhone})`} />
                      {order.gift.message && <InfoRow label="Message" value={order.gift.message} />}
                      {order.gift.deliverOn && <InfoRow label="Deliver on" value={new Date(order.gift.deliverOn).toLocaleDateString("en-SA")} />}
                    </div>
                  </PageSection>
                )}

                {order.customerNotes && (
                  <PageSection title="Customer notes">
                    <p className="text-sm text-slate-700">{order.customerNotes}</p>
                  </PageSection>
                )}
              </div>

              <PageSection title="Safe-use acknowledgement">
                <p className="text-sm text-slate-700">{pickLocalized(order.safeUse.text, "en")}</p>
                <p className="mt-1 text-xs text-slate-400">Accepted {new Date(order.safeUse.acceptedAt).toLocaleString("en-SA")}</p>
              </PageSection>

              {order.status === "CANCELLED" && order.cancellationReason && (
                <PageSection title="Cancellation reason">
                  <p className="text-sm text-slate-700">{order.cancellationReason}</p>
                </PageSection>
              )}

              <PageSection title="Timeline">
                <Timeline items={timelineItems} />
              </PageSection>
            </div>
          );
        }}
      </QueryState>
    </PageShell>
  );
}
