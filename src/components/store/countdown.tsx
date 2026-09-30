"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function remaining(endsAt: string) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    endsAt,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    ended: ms <= 0,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * A ticking countdown to `endsAt` (product sale end, spotlight offer end).
 * Renders nothing once the deadline passes — the caller decides what (if
 * anything) replaces it. Client-only: the first paint uses the same
 * computation server and client would produce, so there is no layout jump,
 * but the tick itself only ever runs after mount.
 */
export function Countdown({ endsAt, size = "md", className = "" }: { endsAt: string; size?: "sm" | "md"; className?: string }) {
  const t = useTranslations("common.countdown");
  // Recomputed from `endsAt` on every render of this lazy initializer, so a
  // changed `endsAt` is reflected immediately without an extra effect-driven
  // sync — the effect below only owns the recurring tick.
  const [state, setState] = useState(() => remaining(endsAt));
  if (state.endsAt !== endsAt) setState(remaining(endsAt));

  useEffect(() => {
    const id = setInterval(() => setState(remaining(endsAt)), 1_000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (state.ended) return null;

  const units = [
    ...(state.days > 0 ? [{ label: t("days"), value: state.days }] : []),
    { label: t("hours"), value: state.hours },
    { label: t("minutes"), value: state.minutes },
    { label: t("seconds"), value: state.seconds },
  ];

  const box = size === "sm" ? "min-w-8 px-1.5 py-1 text-xs" : "min-w-11 px-2 py-1.5 text-sm";

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="timer" aria-live="off">
      {units.map((unit, index) => (
        <span key={unit.label} className="flex items-center gap-1.5">
          <span className={`flex flex-col items-center rounded-card bg-brand-deep text-white ${box}`}>
            <span className="font-bold tabular-nums leading-none">{pad(unit.value)}</span>
            <span className="mt-0.5 text-[0.6rem] leading-none text-white/70">{unit.label}</span>
          </span>
          {index < units.length - 1 ? <span className="text-ink-muted">:</span> : null}
        </span>
      ))}
    </div>
  );
}
