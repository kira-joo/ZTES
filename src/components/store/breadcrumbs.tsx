import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "src/i18n/navigation";

export function Breadcrumbs({ items, locale }: { items: { label: string; href?: string }[]; locale: string }) {
  const Separator = locale === "ar" ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="breadcrumb" className="text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <Separator className="size-3.5 text-ink-muted" aria-hidden="true" /> : null}
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand-dark">
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? "page" : undefined} className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
