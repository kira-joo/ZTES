"use client";

import { toast } from "@kira-joo/frontend-toolkit-tailwind";
import { modalPresentation, useDialog, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { Gift, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CartGiftView } from "src/common/types/cart";
import { STORE_COUNTRY_CODE } from "src/common/config/store";
import { SAUDI_LOCAL_MOBILE, stripSaudiPrefix, toE164SaudiPhone } from "./phone";
import { useSetGift } from "./use-cart";

interface GiftFormState {
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  deliverOn: string;
}

function GiftFormDialog({ dismiss, titleId, initial }: DialogContentProps & { initial: CartGiftView | null }) {
  const t = useTranslations("cart.gift");
  const tv = useTranslations("validation");
  const { setGift, pending } = useSetGift();
  const [form, setForm] = useState<GiftFormState>({
    senderName: initial?.senderName ?? "",
    recipientName: initial?.recipientName ?? "",
    recipientPhone: initial?.recipientPhone ? stripSaudiPrefix(initial.recipientPhone) : "",
    message: initial?.message ?? "",
    deliverOn: initial?.deliverOn ? String(initial.deliverOn).slice(0, 10) : "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GiftFormState, string>>>({});

  const update = (field: keyof GiftFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (form.senderName.trim().length < 2) next.senderName = tv("required");
    if (form.recipientName.trim().length < 2) next.recipientName = tv("required");
    if (!SAUDI_LOCAL_MOBILE.test(form.recipientPhone.trim())) next.recipientPhone = tv("invalidPhone");
    if (form.message.length > 300) next.message = tv("tooLong");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    try {
      await setGift({
        senderName: form.senderName.trim(),
        recipientName: form.recipientName.trim(),
        recipientPhone: toE164SaudiPhone(form.recipientPhone.trim()),
        message: form.message.trim(),
        deliverOn: form.deliverOn || null,
      });
      dismiss();
    } catch {
      toast.error(tv("invalid"));
    }
  };

  const fieldClass = (hasError: boolean) =>
    `h-11 w-full rounded-card border px-3 text-sm text-ink outline-none focus:border-brand ${hasError ? "border-sale" : "border-line"}`;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-5 md:p-6">
      <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold text-ink">
        <Gift className="size-5 text-brand-dark" aria-hidden="true" />
        {t("dialogTitle")}
      </h2>

      <div>
        <label htmlFor="gift-sender-name" className="mb-1 block text-sm font-medium text-ink">
          {t("senderName")}
        </label>
        <input id="gift-sender-name" value={form.senderName} onChange={update("senderName")} className={fieldClass(Boolean(errors.senderName))} maxLength={80} />
        {errors.senderName ? <p className="mt-1 text-xs text-sale">{errors.senderName}</p> : null}
      </div>

      <div>
        <label htmlFor="gift-recipient-name" className="mb-1 block text-sm font-medium text-ink">
          {t("recipientName")}
        </label>
        <input id="gift-recipient-name" value={form.recipientName} onChange={update("recipientName")} className={fieldClass(Boolean(errors.recipientName))} maxLength={80} />
        {errors.recipientName ? <p className="mt-1 text-xs text-sale">{errors.recipientName}</p> : null}
      </div>

      <div>
        <label htmlFor="gift-recipient-phone" className="mb-1 block text-sm font-medium text-ink">
          {t("recipientPhone")}
        </label>
        <div className={`flex items-center overflow-hidden rounded-card border ${errors.recipientPhone ? "border-sale" : "border-line focus-within:border-brand"}`} dir="ltr">
          <span className="shrink-0 border-e border-line bg-canvas px-3 py-2.5 text-sm font-medium text-ink-soft">{STORE_COUNTRY_CODE}</span>
          <input
            id="gift-recipient-phone"
            value={form.recipientPhone}
            onChange={update("recipientPhone")}
            inputMode="numeric"
            maxLength={9}
            dir="ltr"
            className="h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none"
          />
        </div>
        {errors.recipientPhone ? <p className="mt-1 text-xs text-sale">{errors.recipientPhone}</p> : null}
      </div>

      <div>
        <label htmlFor="gift-message" className="mb-1 block text-sm font-medium text-ink">
          {t("message")}
        </label>
        <textarea
          id="gift-message"
          value={form.message}
          onChange={update("message")}
          rows={3}
          maxLength={300}
          className={`${fieldClass(Boolean(errors.message))} h-auto py-2`}
        />
        {errors.message ? <p className="mt-1 text-xs text-sale">{errors.message}</p> : null}
      </div>

      <div>
        <label htmlFor="gift-deliver-on" className="mb-1 block text-sm font-medium text-ink">
          {t("deliverOn")}
        </label>
        <input id="gift-deliver-on" type="date" value={form.deliverOn} onChange={update("deliverOn")} className={fieldClass(false)} />
      </div>

      <p className="text-xs text-ink-muted">{t("riyadhOnly")}</p>

      <div className="mt-1 flex gap-3">
        <button type="button" onClick={dismiss} className="h-11 flex-1 rounded-card border border-line text-sm font-semibold text-ink hover:bg-canvas">
          {t("cancel")}
        </button>
        <button type="submit" disabled={pending} className="h-11 flex-1 rounded-card bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {t("save")}
        </button>
      </div>
    </form>
  );
}

/** The cart's "send as a gift" card: add/edit/remove, opening `GiftFormDialog`. */
export function GiftCard({ gift }: { gift: CartGiftView | null }) {
  const t = useTranslations("cart.gift");
  const { openDialog } = useDialog();
  const { setGift, pending } = useSetGift();

  const open = () => openDialog({ component: GiftFormDialog, props: { initial: gift }, presentation: modalPresentation({ size: "md" }) });

  if (gift) {
    return (
      <div className="rounded-card bg-card p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="size-4 shrink-0 text-brand-dark" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">{t("cardTitle")}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={open} aria-label={t("edit")} className="grid size-8 place-items-center rounded-full text-ink-soft hover:text-brand-dark">
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setGift(null)}
              aria-label={t("remove")}
              className="grid size-8 place-items-center rounded-full text-ink-soft hover:text-sale disabled:opacity-50"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-soft">{gift.recipientName}</p>
        <p className="mt-1 text-xs text-ink-muted">{t("savedNote")}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center gap-3 rounded-card border border-dashed border-line bg-card p-4 text-start shadow-card hover:border-brand"
    >
      <Gift className="size-5 shrink-0 text-brand-dark" aria-hidden="true" />
      <span>
        <span className="block text-sm font-semibold text-ink">{t("cardTitle")}</span>
        <span className="block text-xs text-ink-soft">{t("cardBody")}</span>
      </span>
    </button>
  );
}
