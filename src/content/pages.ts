/**
 * Static pages (about/terms/privacy/shipping/returns). Original ZTES copy —
 * not the reference site's company-history claims (a different company's
 * founding year/city/years-in-business are not ZTES's facts to state). See
 * docs/implementation-plan.md's "Scope correction".
 */
import type { PageView } from "src/common/types/storefront";

const UPDATED_AT = new Date("2026-09-30").toISOString();

export const PAGES: PageView[] = [
  {
    _id: "page-about",
    title: { ar: "من نحن", en: "About ZTES" },
    slug: { ar: "about", en: "about" },
    body: {
      ar: "<p>ZTES متجر إلكتروني متخصص في بيع مبيدات ومعدات مكافحة الحشرات المنزلية والزراعية. نوفر توصيلًا داخل مدينة الرياض مع الدفع عند الاستلام، بدون الحاجة لإنشاء حساب.</p><p>هدفنا تسهيل وصولك لمنتجات موثوقة لمكافحة الآفات الشائعة كالصراصير والبعوض والنمل والقوارض وبق الفراش، بأسعار واضحة وتجربة شراء بسيطة.</p>",
      en: "<p>ZTES is an online store specialising in pest control products and equipment for home and agricultural use. We deliver within Riyadh with cash on delivery — no account required.</p><p>Our goal is simple: reliable products for common pests like cockroaches, mosquitoes, ants, rodents and bed bugs, at clear prices with a straightforward checkout.</p>",
    },
    showInFooter: true,
    seo: { title: { ar: "من نحن", en: "About ZTES" }, description: { ar: "تعرف على ZTES ومبيدات مكافحة الحشرات التي نوفرها في الرياض.", en: "Learn about ZTES and the pest control products we offer in Riyadh." } },
    updatedAt: UPDATED_AT,
  },
  {
    _id: "page-terms",
    title: { ar: "الشروط والأحكام", en: "Terms & Conditions" },
    slug: { ar: "terms", en: "terms" },
    body: {
      ar: "<p>باستخدامك لموقع ZTES وإتمام طلب، فإنك توافق على الشروط التالية:</p><ul><li>التوصيل متاح حاليًا داخل مدينة الرياض فقط.</li><li>طريقة الدفع المتاحة هي الدفع عند الاستلام فقط.</li><li>يجب التأكد من صحة بيانات التواصل وعنوان التوصيل عند إتمام الطلب.</li><li>الأسعار المعروضة شاملة ضريبة القيمة المضافة.</li><li>يحتفظ المتجر بحق إلغاء أي طلب يتعذر تنفيذه أو توصيله.</li></ul>",
      en: "<p>By using ZTES and placing an order, you agree to the following:</p><ul><li>Delivery is currently available within Riyadh city only.</li><li>Cash on delivery is the only available payment method.</li><li>Contact details and the delivery address must be accurate at checkout.</li><li>Displayed prices include VAT.</li><li>ZTES reserves the right to cancel an order that cannot be fulfilled or delivered.</li></ul>",
    },
    showInFooter: true,
    seo: { title: { ar: "الشروط والأحكام", en: "Terms & Conditions" }, description: { ar: "شروط وأحكام الشراء من متجر ZTES.", en: "Terms and conditions for shopping at ZTES." } },
    updatedAt: UPDATED_AT,
  },
  {
    _id: "page-privacy",
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    slug: { ar: "privacy", en: "privacy" },
    body: {
      ar: "<p>لا يتطلب الطلب من ZTES إنشاء حساب. نجمع فقط بيانات الطلب الضرورية: الاسم، رقم الجوال، البريد الإلكتروني، وعنوان التوصيل، وذلك لغرض تنفيذ الطلب والتواصل بشأنه فقط.</p><p>لا تتم مشاركة بياناتك مع أي جهة خارجية لأغراض تسويقية.</p>",
      en: "<p>Ordering from ZTES does not require an account. We collect only what an order needs: name, phone number, email and delivery address, used solely to fulfil and communicate about that order.</p><p>Your information is never shared with a third party for marketing purposes.</p>",
    },
    showInFooter: true,
    seo: { title: { ar: "سياسة الخصوصية", en: "Privacy Policy" }, description: { ar: "كيف يتعامل ZTES مع بياناتك.", en: "How ZTES handles your data." } },
    updatedAt: UPDATED_AT,
  },
  {
    _id: "page-shipping",
    title: { ar: "سياسة الشحن والتوصيل", en: "Shipping & Delivery Policy" },
    slug: { ar: "shipping-policy", en: "shipping-policy" },
    body: {
      ar: "<p>التوصيل متاح حاليًا داخل مدينة الرياض فقط، خلال 24–48 ساعة من تأكيد الطلب.</p><p>رسوم التوصيل ثابتة، وتصبح مجانية للطلبات التي تتجاوز 199 ريال. لا يتوفر حاليًا استلام من فرع.</p>",
      en: "<p>Delivery is currently available within Riyadh city only, arriving within 24–48 hours of order confirmation.</p><p>A flat delivery fee applies, waived on orders over 199 SAR. Branch pickup is not currently available.</p>",
    },
    showInFooter: true,
    seo: { title: { ar: "سياسة الشحن والتوصيل", en: "Shipping & Delivery Policy" }, description: { ar: "مناطق ومدة ورسوم التوصيل في ZTES.", en: "Delivery area, timing and fees at ZTES." } },
    updatedAt: UPDATED_AT,
  },
  {
    _id: "page-returns",
    title: { ar: "سياسة الإرجاع والاستبدال", en: "Return & Exchange Policy" },
    slug: { ar: "return-policy", en: "return-policy" },
    body: {
      ar: "<p>يمكن استرجاع أو استبدال أي منتج خلال 7 أيام من تاريخ الاستلام، بشرط أن يكون بحالته الأصلية ولم يُفتح أو يُستخدم.</p><p>للطلب، تواصل معنا عبر بيانات التواصل الموضحة في صفحة الطلب.</p>",
      en: "<p>A product may be returned or exchanged within 7 days of delivery, provided it is unopened, unused and in its original condition.</p><p>To start a return, use the contact details shown on your order page.</p>",
    },
    showInFooter: true,
    seo: { title: { ar: "سياسة الإرجاع والاستبدال", en: "Return & Exchange Policy" }, description: { ar: "شروط استرجاع واستبدال المنتجات في ZTES.", en: "Return and exchange terms at ZTES." } },
    updatedAt: UPDATED_AT,
  },
];
