"use client";

import { FormInput, FormTextarea } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { AlertTriangle, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { STORE_COUNTRY_CODE } from "src/common/config/store";
import { Price } from "src/components/store/price";
import { useCart, usePlaceOrder } from "src/features/storefront/cart/use-cart";
import { SAUDI_LOCAL_MOBILE, toE164SaudiPhone } from "src/features/storefront/cart/phone";
import { SafeUseCheckbox } from "src/features/storefront/cart/safe-use-checkbox";
import { cartSignature, useSafeUseAcceptance } from "src/features/storefront/cart/use-safe-use";
import { Link, useRouter } from "src/i18n/navigation";
import { pickLocalized } from "src/lib/localized";
import { formatAmount } from "src/lib/money";

interface CheckoutFormValues {
  contact: { firstName: string; lastName: string; phone: string; email: string };
  address: { district: string; street: string; building: string; notes: string; mapUrl: string };
  customerNotes: string;
}

export function CheckoutForm({
  cityLabel,
  deliveryEstimate,
  safeUseTitle,
  safeUseText,
}: {
  cityLabel: string;
  deliveryEstimate: string;
  safeUseTitle: string;
  safeUseText: string;
}) {
  const t = useTranslations("checkout");
  const tv = useTranslations("validation");
  const tc = useTranslations("cart.coupon.rejection");
  const locale = useLocale();
  const router = useRouter();
  const { cart, loading } = useCart();
  const { placeOrder, resetAttempt, pending } = usePlaceOrder();
  const [accepted, setAccepted] = useSafeUseAcceptance(cartSignature(cart));
  const [showSafeUseError, setShowSafeUseError] = useState(false);
  const [cartChangedIssues, setCartChangedIssues] = useState<{ lineId?: string; issue?: string }[] | null>(null);
  const [couponRejection, setCouponRejection] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      contact: { firstName: "", lastName: "", phone: "", email: "" },
      address: { district: "", street: "", building: "", notes: "", mapUrl: "" },
      customerNotes: "",
    },
  });

  const phoneField = useController({
    control: form.control,
    name: "contact.phone",
    rules: { required: tv("required"), pattern: { value: SAUDI_LOCAL_MOBILE, message: tv("invalidPhone") } },
  });

  useEffect(() => {
    if (!loading && (!cart || cart.lines.length === 0 || cart.hasIssues)) {
      router.replace("/cart");
    }
  }, [loading, cart, router]);

  if (loading || !cart || cart.lines.length === 0 || cart.hasIssues) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-40 animate-pulse rounded-card bg-card shadow-card" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-card bg-card shadow-card" />
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!accepted) {
      setShowSafeUseError(true);
      return;
    }
    setCartChangedIssues(null);
    setCouponRejection(null);
    setGenericError(null);

    try {
      const { orderNumber } = await placeOrder({
        contact: { ...values.contact, phone: toE164SaudiPhone(values.contact.phone) },
        address: {
          district: values.address.district,
          street: values.address.street,
          ...(values.address.building ? { building: values.address.building } : {}),
          ...(values.address.notes ? { notes: values.address.notes } : {}),
          ...(values.address.mapUrl ? { mapUrl: values.address.mapUrl } : {}),
        },
        ...(values.customerNotes ? { customerNotes: values.customerNotes } : {}),
        safeUseAccepted: accepted,
        paymentMethod: "CASH_ON_DELIVERY",
        locale: locale === "en" ? "en" : "ar",
      });
      router.push(`/orders/${orderNumber}`);
    } catch (error) {
      const apiError = error as { validationErrors?: { field: string; message: string }[]; raw?: { details?: { reason?: string; issues?: unknown[]; rejection?: string } } };
      const reason = apiError.raw?.details?.reason;

      if (apiError.validationErrors && apiError.validationErrors.length > 0) {
        for (const fieldError of apiError.validationErrors) {
          form.setError(fieldError.field as never, { type: "server", message: tv(fieldError.message) });
        }
        return;
      }
      if (reason === "CART_CHANGED") {
        setCartChangedIssues((apiError.raw?.details?.issues as { lineId?: string; issue?: string }[]) ?? []);
        resetAttempt();
        return;
      }
      if (reason === "COUPON_REJECTED") {
        setCouponRejection(apiError.raw?.details?.rejection ?? null);
        resetAttempt();
        return;
      }
      if (reason === "EMPTY_CART") {
        router.replace("/cart");
        return;
      }
      setGenericError(t("errors.generic"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex flex-col gap-5">
        {cartChangedIssues ? (
          <div className="flex items-start gap-2 rounded-card border border-sale bg-sale-soft p-4 text-sm text-sale">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t("errors.cartChangedTitle")}</p>
              <p className="mt-1">{t("errors.cartChangedBody")}</p>
              <Link href="/cart" className="mt-2 inline-block font-semibold underline">
                {t("backToCart")}
              </Link>
            </div>
          </div>
        ) : null}
        {couponRejection ? (
          <div className="flex items-start gap-2 rounded-card border border-sale bg-sale-soft p-4 text-sm text-sale">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t("errors.couponRejected")}</p>
              <p className="mt-1">{tc(couponRejection)}</p>
              <Link href="/cart" className="mt-2 inline-block font-semibold underline">
                {t("backToCart")}
              </Link>
            </div>
          </div>
        ) : null}
        {genericError ? (
          <div className="flex items-center gap-2 rounded-card border border-sale bg-sale-soft p-4 text-sm font-medium text-sale">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {genericError}
          </div>
        ) : null}

        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-ink">{t("contact.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={form.control} name="contact.firstName" label={t("contact.firstName")} rules={{ required: tv("required") }} />
            <FormInput control={form.control} name="contact.lastName" label={t("contact.lastName")} rules={{ required: tv("required") }} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="contact-phone">
                {t("contact.phone")}
              </label>
              <div className={`flex items-center overflow-hidden rounded-card border bg-card ${phoneField.fieldState.error ? "border-sale" : "border-line focus-within:border-brand"}`} dir="ltr">
                <span className="shrink-0 border-e border-line bg-canvas px-3 py-2.5 text-sm font-medium text-ink-soft">{STORE_COUNTRY_CODE}</span>
                <input
                  id="contact-phone"
                  value={phoneField.field.value ?? ""}
                  onChange={phoneField.field.onChange}
                  onBlur={phoneField.field.onBlur}
                  inputMode="numeric"
                  maxLength={9}
                  dir="ltr"
                  className="h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none"
                />
              </div>
              {phoneField.fieldState.error ? <p className="mt-1 text-xs text-sale">{phoneField.fieldState.error.message}</p> : null}
            </div>
            <FormInput
              control={form.control}
              name="contact.email"
              type="email"
              dir="ltr"
              label={t("contact.email")}
              rules={{ required: tv("required"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: tv("invalidEmail") } }}
            />
          </div>
        </section>

        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-ink">{t("delivery.title")}</h2>
          <div className="mb-4 flex items-center gap-2 rounded-card bg-canvas px-3 py-2.5 text-sm text-ink-soft">
            <Truck className="size-4 shrink-0 text-brand-dark" aria-hidden="true" />
            <span>
              {t("delivery.city")}: <span className="font-semibold text-ink">{cityLabel}</span>
            </span>
            {deliveryEstimate ? <span className="ms-auto text-xs">{deliveryEstimate}</span> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={form.control} name="address.district" label={t("delivery.district")} rules={{ required: tv("required") }} />
            <FormInput control={form.control} name="address.street" label={t("delivery.street")} rules={{ required: tv("required") }} />
            <FormInput control={form.control} name="address.building" label={t("delivery.building")} />
            <FormInput control={form.control} name="address.mapUrl" dir="ltr" label={t("delivery.mapUrl")} placeholder={t("delivery.mapUrlPlaceholder")} />
          </div>
          <div className="mt-4">
            <FormTextarea control={form.control} name="address.notes" label={t("delivery.notes")} rows={2} />
          </div>
        </section>

        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-ink">{t("payment.title")}</h2>
          <div className="flex items-center gap-3 rounded-card border-2 border-brand bg-brand-soft px-4 py-3">
            <span className="grid size-5 place-items-center rounded-full border-2 border-brand bg-brand">
              <span className="size-2 rounded-full bg-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{t("payment.cod")}</p>
              <p className="text-xs text-ink-soft">{t("payment.codNote")}</p>
            </div>
          </div>
        </section>

        <SafeUseCheckbox
          title={safeUseTitle}
          text={safeUseText}
          checked={accepted}
          onChange={(next) => {
            setAccepted(next);
            if (next) setShowSafeUseError(false);
          }}
          showRequiredError={showSafeUseError && !accepted}
        />

        <section className="rounded-card bg-card p-5 shadow-card">
          <FormTextarea control={form.control} name="customerNotes" label={t("notes.label")} placeholder={t("notes.placeholder")} rows={3} />
        </section>
      </div>

      <aside className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold text-ink">{t("summary.title")}</h2>
        <p className="text-sm text-ink-soft">{t("summary.itemCount", { count: cart.itemCount })}</p>
        <ul className="flex flex-col gap-2 text-sm text-ink-soft">
          {cart.lines.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-2">
              <span className="line-clamp-1">
                {pickLocalized(line.name, locale)} × {line.quantity}
              </span>
              <span className="shrink-0">{formatAmount(line.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <hr className="border-line" />
        <div className="flex items-center justify-between text-base font-bold text-ink">
          <span>{t("delivery.feeLabel")}</span>
          <span>{Number(cart.pricing.shippingFee) === 0 ? t("delivery.free") : formatAmount(cart.pricing.shippingFee, locale)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold text-ink">
          <span>{t("summary.title")}</span>
          <Price value={cart.pricing.total} locale={locale} size="lg" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-card bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </aside>
    </form>
  );
}
