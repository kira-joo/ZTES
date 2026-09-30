import type { ComponentProps } from "react";
import { Link } from "src/i18n/navigation";

/**
 * Admin-entered links: an internal path ("/categories/…") goes through the
 * locale-aware Link; anything absolute opens as a plain anchor.
 */
export function SmartLink({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  if (!href) return <span className={props.className}>{props.children}</span>;
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    const external = href.startsWith("http");
    return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props} />;
  }
  return <Link href={href} {...props} />;
}
