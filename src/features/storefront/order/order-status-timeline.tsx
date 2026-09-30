import { Check, Package, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { OrderStatus } from "src/common/enums";

const STEPS = [OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED] as const;
const ICONS = { [OrderStatus.PLACED]: Check, [OrderStatus.CONFIRMED]: Check, [OrderStatus.OUT_FOR_DELIVERY]: Truck, [OrderStatus.DELIVERED]: Package };

/** The order's status timeline. A cancelled order gets its own, terminal row instead of the step track. */
export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const t = useTranslations("order.status");

  if (status === OrderStatus.CANCELLED) {
    return (
      <div className="flex items-center gap-3 rounded-card bg-sale-soft p-4 text-sale">
        <X className="size-5 shrink-0" aria-hidden="true" />
        <p className="font-semibold">{t("CANCELLED")}</p>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <ol className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      {STEPS.map((step, index) => {
        const Icon = ICONS[step];
        const reached = index <= currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${reached ? "bg-brand text-white" : "bg-band text-ink-muted"}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className={`text-xs font-medium sm:text-sm ${reached ? "text-ink" : "text-ink-muted"}`}>{t(step)}</span>
            {index < STEPS.length - 1 ? <span className={`h-0.5 flex-1 ${index < currentIndex ? "bg-brand" : "bg-band"}`} aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
