import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Gift as GiftIcon, StickyNote, Truck } from "lucide-react";
import { OrderStatus } from "src/common/enums";
import { RiyalSymbol } from "src/components/store/riyal-symbol";
import { OrderReviewForm } from "src/features/storefront/order/order-review-form";
import { OrderStatusTimeline } from "src/features/storefront/order/order-status-timeline";
import type { OrderPlainView } from "src/features/storefront/order/order-types";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { formatAmount } from "src/lib/money";
import { findAccessibleOrder } from "src/server/commerce/order-access";
import { toPlain } from "src/server/core/serialization/to-plain";

type Props = PageProps<"/[locale]/orders/[orderNumber]">;

async function load(orderNumber: string): Promise<OrderPlainView | null> {
  try {
    const order = await findAccessibleOrder(orderNumber);
    return toPlain(order) as unknown as OrderPlainView;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return { title: `${t("orderNumber")} ${orderNumber}`, robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: Props) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const order = await load(orderNumber);
  if (!order) notFound();

  const t = await getTranslations("order");
  const money = (value: string) => (
    <span className="inline-flex items-center gap-1">
      {formatAmount(value, locale)}
      <RiyalSymbol />
    </span>
  );

  return (
    <div className="mx-auto max-w-4xl px-3 py-8 md:px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">{t("thankYou")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("confirmedBody")}</p>
        <p className="mt-3 inline-block rounded-full bg-card px-4 py-2 text-sm font-bold tabular-nums text-ink shadow-card" dir="ltr">
          {order.orderNumber}
        </p>
      </div>

      <section className="mb-8 rounded-card bg-card p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-ink-soft">{t("status.title")}</h2>
        <OrderStatusTimeline status={order.status} />
      </section>

      <section className="mb-8 rounded-card bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-ink">{t("lines.title")}</h2>
        <ul className="flex flex-col gap-4">
          {order.lines.map((line, index) => {
            const name = pickLocalized(line.name, locale);
            const slug = pickSlug(line.slug, locale);
            return (
              <li key={index} className="flex flex-col gap-3 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row">
                <div className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-canvas">
                    {line.imageUrl ? (
                      <Image src={line.imageUrl} alt={name} fill sizes="64px" className="object-contain p-1" />
                    ) : (
                      <div aria-hidden="true" className="absolute inset-0 bg-band/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/products/${slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-dark">
                      {name}
                    </Link>
                    {line.selectedOptions.length > 0 ? (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {line.selectedOptions.map((option) => `${pickLocalized(option.group, locale)}: ${pickLocalized(option.value, locale)}`).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-ink-muted">{t("lines.quantity", { count: line.quantity })}</p>
                  </div>
                </div>
                <div className="sm:ms-auto sm:text-end">
                  <p className="text-sm font-bold text-ink">{money(line.lineTotal)}</p>
                  {order.status === OrderStatus.DELIVERED ? (
                    <div className="mt-3 sm:w-72">
                      <OrderReviewForm orderNumber={order.orderNumber} productId={line.product} productName={name} />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
            <MapPin className="size-4" aria-hidden="true" />
            {t("delivery.title")}
          </h2>
          <p className="text-sm text-ink">
            {[pickLocalized(order.deliveryAddress.city, locale), order.deliveryAddress.district, order.deliveryAddress.street, order.deliveryAddress.building]
              .filter(Boolean)
              .join(locale === "ar" ? "، " : ", ")}
          </p>
          {order.deliveryAddress.notes ? <p className="mt-1 text-xs text-ink-soft">{t("delivery.notes", { notes: order.deliveryAddress.notes })}</p> : null}
        </section>

        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Truck className="size-4" aria-hidden="true" />
            {t("payment.title")}
          </h2>
          <p className="text-sm text-ink">{t("payment.cod")}</p>
        </section>

        {order.gift ? (
          <section className="rounded-card bg-card p-5 shadow-card sm:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
              <GiftIcon className="size-4" aria-hidden="true" />
              {t("gift.title")}
            </h2>
            <p className="text-sm text-ink">{t("gift.to", { name: order.gift.recipientName })}</p>
            {order.gift.message ? <p className="mt-1 text-sm text-ink-soft">{t("gift.message", { message: order.gift.message })}</p> : null}
          </section>
        ) : null}

        {order.customerNotes ? (
          <section className="rounded-card bg-card p-5 shadow-card sm:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
              <StickyNote className="size-4" aria-hidden="true" />
              {t("customerNotes.title")}
            </h2>
            <p className="text-sm text-ink-soft">{order.customerNotes}</p>
          </section>
        ) : null}
      </div>

      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-ink">{t("summary.title")}</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>{t("summary.subtotal")}</span>
            {money(order.pricing.subtotal)}
          </div>
          {Number(order.pricing.couponDiscount) > 0 ? (
            <div className="flex justify-between text-brand-dark">
              <span>{t("summary.couponDiscount")}</span>
              <span>
                -{formatAmount(order.pricing.couponDiscount, locale)}
                <RiyalSymbol className="ms-1 inline size-[0.85em]" />
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-soft">
            <span>{t("summary.shipping")}</span>
            {Number(order.pricing.shippingFee) === 0 ? <span>{t("summary.free")}</span> : money(order.pricing.shippingFee)}
          </div>
          <hr className="border-line" />
          <div className="flex justify-between text-base font-bold text-ink">
            <span>{t("summary.total")}</span>
            {money(order.pricing.total)}
          </div>
          <p className="text-xs text-ink-muted">{t("summary.vatIncluded", { amount: formatAmount(order.pricing.vatIncluded, locale) })}</p>
        </div>
      </section>
    </div>
  );
}
