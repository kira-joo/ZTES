import { Link } from "src/i18n/navigation";

/** The reference's rail heading: centred title between rules, subtitle, green-underlined link. */
export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  align?: "center" | "start";
}) {
  if (!title) return null;
  if (align === "start") {
    return (
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink md:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
        </div>
        {href && linkLabel ? (
          <Link href={href} className="shrink-0 border-b-2 border-brand pb-0.5 text-sm font-medium text-ink hover:text-brand-dark">
            {linkLabel}
          </Link>
        ) : null}
      </div>
    );
  }
  return (
    <div className="mb-6 text-center">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <h2 className="text-xl font-bold text-ink md:text-2xl">{title}</h2>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      {href && linkLabel ? (
        <Link href={href} className="mt-2 inline-block border-b-2 border-brand pb-0.5 text-sm font-medium text-ink hover:text-brand-dark">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
