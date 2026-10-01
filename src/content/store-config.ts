/**
 * Store identity/contact/social/legal/delivery/VAT/safe-use text. Static app
 * content — not a database row (see docs/implementation-plan.md's "Scope
 * correction"). Delivery fee, free-shipping threshold and VAT rate are
 * genuine ZTES business decisions, not scraped from the reference.
 *
 * Deliberately NOT the reference site's real phone/WhatsApp/email/social
 * handles or VAT/CR numbers: those identify a different real business, and
 * publishing them as ZTES's own would misdirect real people or misstate legal
 * registration ZTES does not hold. The WhatsApp number, VAT number, company name
 * and National Address are ZTES's own (from its business documents); the rest
 * stay blank until ZTES has its own.
 */
import { AssetProviderType, toMoney, type LocalizedString, type Money } from "@kira-joo/toolkit-common";
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

/** ZTES's registered company name. Only the Arabic name is registered, so both locales show it. */
const COMPANY_NAME = "شركة زاد الفنية لحلول البيئة";

/** ZTES's National Address, field for field as registered. */
const NATIONAL_ADDRESS = {
  shortAddress: "RBGC3981",
  buildingNumber: "3981",
  street: { ar: "الإمام فيصل بن تركي بن عبدالله", en: "Al Imam Faisal Ibn Turki Ibn Abdullah" },
  district: { ar: "حي ام سليم", en: "Umm Saleem Dist." },
  secondaryNumber: "8662",
  postalCode: "12744",
  city: { ar: "الرياض", en: "Riyadh" },
  country: { ar: "المملكة العربية السعودية", en: "Kingdom of Saudi Arabia" },
} as const;

/** The National Address in its standard order: building street, district, city postal code - secondary number, country. */
function formatNationalAddress(locale: "ar" | "en"): string {
  const a = NATIONAL_ADDRESS;
  const comma = locale === "ar" ? "، " : ", ";
  return [
    `${a.buildingNumber} ${a.street[locale]}`,
    a.district[locale],
    `${a.city[locale]} ${a.postalCode} - ${a.secondaryNumber}`,
    a.country[locale],
  ].join(comma);
}

/** ZTES's VAT registration certificate: a static /public file in the `ImageAsset` shape the footer dialog renders. */
const VAT_CERTIFICATE = {
  provider: AssetProviderType.CLOUDINARY,
  publicId: "static/images/tax-certificate.png",
  secureUrl: "/images/tax-certificate.png",
  format: "png",
  width: 595,
  height: 841,
  bytes: 332325,
};

export const STORE_CONFIG: SettingsView = {
  storeName: { ar: "ZTES", en: "ZTES" },
  tagline: {
    ar: "متجر مبيدات ومكافحة حشرية — توصيل داخل الرياض والدفع عند الاستلام",
    en: "Pest control products — Riyadh delivery, cash on delivery",
  },
  logo: null,
  favicon: null,
  contact: {
    phone: "",
    whatsapp: "+966503220039",
    email: "",
    address: { ar: formatNationalAddress("ar"), en: formatNationalAddress("en") },
    shortAddress: NATIONAL_ADDRESS.shortAddress,
  },
  social: { instagram: "", x: "", tiktok: "", facebook: "", youtube: "", snapchat: "" },
  legal: { companyName: { ar: COMPANY_NAME, en: COMPANY_NAME }, vatNumber: "31496889600003", crNumber: "", vatCertificate: VAT_CERTIFICATE },
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
