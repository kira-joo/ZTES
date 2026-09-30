import { Facebook, Ghost, Instagram, Music2, Twitter, Youtube } from "lucide-react";
import type { SettingsView } from "src/common/types/storefront";

const ICONS = {
  instagram: Instagram,
  x: Twitter,
  snapchat: Ghost,
  tiktok: Music2,
  youtube: Youtube,
  facebook: Facebook,
} as const;

const LABELS: Record<keyof typeof ICONS, string> = {
  instagram: "Instagram",
  x: "X",
  snapchat: "Snapchat",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
};

export function SocialIcons({ social, size = "md" }: { social: SettingsView["social"]; size?: "md" | "lg" }) {
  const entries = (Object.keys(ICONS) as (keyof typeof ICONS)[]).filter((key) => social[key]);
  if (entries.length === 0) return null;
  const box = size === "lg" ? "size-12" : "size-10";
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {entries.map((key) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={social[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={LABELS[key]}
              className={`grid ${box} place-items-center rounded-full bg-band text-ink transition-colors hover:bg-brand hover:text-white`}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
