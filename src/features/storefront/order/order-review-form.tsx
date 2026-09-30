"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { submitReviewEndpoint } from "api/storefront-cart.endpoints";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getStorefrontApi } from "src/lib/api-client";

/** One product's review form, shown per delivered-order line. */
export function OrderReviewForm({ orderNumber, productId, productName }: { orderNumber: string; productId: string; productName: string }) {
  const t = useTranslations("order.review");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "submitted" | "already" | "error">("idle");
  const mutation = useRequesterMutation({ endpoint: submitReviewEndpoint, client: getStorefrontApi() });

  if (state === "submitted") {
    return <p className="rounded-card bg-brand-soft p-3 text-sm font-medium text-brand-dark">{t("submitted")}</p>;
  }
  if (state === "already") {
    return <p className="rounded-card bg-canvas p-3 text-sm text-ink-soft">{t("alreadySubmitted")}</p>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1 || authorName.trim().length < 2) return;
    try {
      await mutation.mutateAsync({
        params: { orderNumber },
        body: { productId, rating, authorName: authorName.trim(), ...(body.trim() ? { body: body.trim() } : {}) },
      });
      setState("submitted");
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      setState(status === 409 ? "already" : "error");
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border border-line p-4">
      <p className="text-sm font-semibold text-ink">{t("prompt", { name: productName })}</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t("rating")}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={String(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(value)}
            className="p-0.5"
          >
            <Star className={`size-6 ${value <= displayRating ? "fill-star text-star" : "text-line"}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <input
        value={authorName}
        onChange={(event) => setAuthorName(event.target.value)}
        placeholder={t("name")}
        maxLength={80}
        className="h-10 rounded-card border border-line px-3 text-sm text-ink outline-none focus:border-brand"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("comment")}
        rows={2}
        maxLength={2000}
        className="rounded-card border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
      {state === "error" ? <p className="text-xs text-sale">{t("error")}</p> : null}
      <button
        type="submit"
        disabled={mutation.isPending || rating < 1 || authorName.trim().length < 2}
        className="h-10 rounded-card bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {t("submit")}
      </button>
    </form>
  );
}
