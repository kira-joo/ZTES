"use client";

import { X } from "lucide-react";
import { useState } from "react";

const KEY = "ztes:announcement-dismissed";

/** The reference's scrolling green bar. Dismissal lasts for the browser session. */
export function AnnouncementBar({ messages, closeLabel }: { messages: string[]; closeLabel: string }) {
  // Reads directly during render — sessionStorage has no listener to
  // subscribe to, so an effect would only add an extra render before hiding.
  // Guarded for the server pass and for storage being unavailable.
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  if (hidden || messages.length === 0) return null;

  const line = messages.join("   |   ");
  const repeated = Array.from({ length: 6 }, (_, index) => (
    <span key={index} className="px-8">
      {line}
    </span>
  ));

  return (
    <div className="store-marquee relative flex h-10 items-center overflow-hidden bg-brand text-sm font-medium text-white">
      <div className="store-marquee-track flex w-max shrink-0 whitespace-nowrap">
        <div className="flex">{repeated}</div>
        <div className="flex" aria-hidden="true">
          {repeated}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            window.sessionStorage.setItem(KEY, "1");
          } catch {
            /* storage unavailable */
          }
        }}
        aria-label={closeLabel}
        className="absolute inset-y-0 end-0 grid w-10 place-items-center bg-brand text-white/90 hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
