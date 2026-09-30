import type { SideNavSectionConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Folder, LayoutDashboard, Package, ShoppingCart, Ticket } from "lucide-react";

/**
 * One admin, no permissions to check — every item is always visible.
 *
 * Admin manages only dynamic commerce data: Products, Categories, Coupons,
 * Orders. Everything else (home sections, FAQ, testimonials, static pages,
 * blog, newsletter, settings, brand write, review moderation, a standalone
 * customers screen) is static content or has no admin surface — see
 * docs/implementation-plan.md's "Scope correction".
 */
export const ADMIN_NAV_SECTIONS: SideNavSectionConfig[] = [
  {
    key: "overview",
    items: [{ key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, match: "exact" }],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { key: "products", label: "Products", href: "/admin/products", icon: Package },
      { key: "categories", label: "Categories", href: "/admin/categories", icon: Folder },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    items: [
      { key: "coupons", label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    ],
  },
];
