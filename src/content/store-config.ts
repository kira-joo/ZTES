/**
 * Store identity/contact/social/legal/delivery/VAT/safe-use text. Static app
 * content — not a database row (see docs/implementation-plan.md's "Scope
 * correction"). Delivery fee, free-shipping threshold and VAT rate are
 * genuine ZTES business decisions, not scraped from the reference.
 *
 * Deliberately NOT the reference site's real phone/WhatsApp/email/social
 * handles or VAT/CR numbers: those identify a different real business, and
 * publishing them as ZTES's own would misdirect real people or misstate legal
 * registration ZTES does not hold. Left blank until ZTES has its own.
 */
import { toMoney, type LocalizedString, type Money } from "@kira-joo/toolkit-common";
import type { SettingsView } from "src/common/types/storefront";

/**
 * Raw `Money`/business values, for the pricing engine (`cart.service.ts`,
 * `place-order.ts`) — `STORE_CONFIG` below carries the same numbers as
 * display-formatted strings for the storefront view layer. One source of
 * truth: the view is derived from these, not typed independently.
 */
export const DELIVERY_CITY: LocalizedString = { ar: "الرياض", en: "Riyadh" };
export const DELIVERY_FEE: Money = toMoney("20.00");
export const FREE_SHIPPING_THRESHOLD: Money = toMoney("199.00");
export const VAT_RATE = 15;
export const SAFE_USE_TEXT: LocalizedString = {
  ar: "المبيدات تُستخدم حسب الملصق وبعيدًا عن متناول الأطفال والحيوانات الأليفة.",
  en: "Pesticides are used according to the label and kept away from children and pets.",
};

export const STORE_CONFIG: SettingsView = {
  storeName: { ar: "ZTES", en: "ZTES" },
  tagline: {
    ar: "متجر مبيدات ومكافحة حشرية — توصيل داخل الرياض والدفع عند الاستلام",
    en: "Pest control products — Riyadh delivery, cash on delivery",
  },
  logo: null,
  favicon: null,
  contact: { phone: "", whatsapp: "", email: "", address: { ar: "الرياض، المملكة العربية السعودية", en: "Riyadh, Saudi Arabia" } },
  social: { instagram: "", x: "", tiktok: "", facebook: "", youtube: "", snapchat: "" },
  legal: { vatNumber: "", crNumber: "", vatCertificate: null },
  appLinks: { appStore: "", googlePlay: "" },
  announcements: [
    { ar: "الدفع عند الاستلام | شحن مجاني للطلبات فوق 199 ريال داخل الرياض", en: "Cash on delivery | Free shipping in Riyadh on orders over 199 SAR" },
  ],
  footerDescription: {
    ar: "ZTES متجر إلكتروني لمبيدات ومعدات مكافحة الحشرات، يوفر توصيلًا داخل الرياض مع الدفع عند الاستلام.",
    en: "ZTES is an online store for pest control products and equipment, delivering within Riyadh with cash on delivery.",
  },
  delivery: {
    city: DELIVERY_CITY,
    fee: DELIVERY_FEE.toFixed(2),
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD.toFixed(2),
    estimate: { ar: "التوصيل خلال 24–48 ساعة داخل الرياض", en: "Delivered within 24–48 hours in Riyadh" },
  },
  vatRate: VAT_RATE,
  safeUseTitle: { ar: "إقرار الاستخدام الآمن", en: "Safe use acknowledgement" },
  safeUseText: SAFE_USE_TEXT,
  branches: [],
  popup: {
    isActive: false,
    title: { ar: "", en: "" },
    body: { ar: "", en: "" },
    image: null,
    ctaLabel: { ar: "", en: "" },
    ctaHref: "",
  },
  seo: {
    title: { ar: "ZTES — مبيدات ومكافحة حشرية", en: "ZTES — Pest Control Products" },
    description: {
      ar: "تسوق مبيدات ومعدات مكافحة الحشرات مع توصيل داخل الرياض والدفع عند الاستلام.",
      en: "Shop pest control products and equipment with Riyadh delivery and cash on delivery.",
    },
  },
};
