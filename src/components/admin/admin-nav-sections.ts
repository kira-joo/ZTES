import type { SideNavSectionConfig } from "@kira-joo/frontend-toolkit-tailwind";
import {
  FileText,
  Folder,
  HelpCircle,
  LayoutDashboard,
  LayoutList,
  Mail,
  MessageSquareQuote,
  Newspaper,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Users,
} from "lucide-react";

/** One admin, no permissions to check — every item is always visible. */
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
      { key: "brands", label: "Brands", href: "/admin/brands", icon: Tag },
      { key: "reviews", label: "Reviews", href: "/admin/reviews", icon: Star },
      { key: "coupons", label: "Coupons", href: "/admin/coupons", icon: Ticket },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    items: [
      { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { key: "customers", label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    key: "content",
    label: "Content",
    items: [
      { key: "home-sections", label: "Home sections", href: "/admin/home-sections", icon: LayoutList },
      { key: "pages", label: "Static pages", href: "/admin/pages", icon: FileText },
      { key: "posts", label: "Blog posts", href: "/admin/posts", icon: Newspaper },
      { key: "faqs", label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
      { key: "testimonials", label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
      { key: "newsletter", label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    key: "store",
    label: "Store",
    items: [{ key: "settings", label: "Settings", href: "/admin/settings", icon: Settings }],
  },
];
