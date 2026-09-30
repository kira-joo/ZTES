/** Static FAQ content. See docs/implementation-plan.md's "Scope correction". */
import type { FaqView } from "src/common/types/storefront";

export const FAQS: FaqView[] = [
  {
    _id: "faq-delivery-time",
    question: { ar: "خلال كم يوم يصل الطلب؟", en: "How long does delivery take?" },
    answer: {
      ar: "داخل الرياض: خلال 24–48 ساعة من تأكيد الطلب.",
      en: "Within Riyadh: within 24–48 hours of order confirmation.",
    },
  },
  {
    _id: "faq-payment",
    question: { ar: "ما هي طريقة الدفع المتاحة؟", en: "What payment methods are available?" },
    answer: {
      ar: "الدفع عند الاستلام (كاش) فقط عند تسليم الطلب.",
      en: "Cash on delivery only, paid when your order arrives.",
    },
  },
  {
    _id: "faq-delivery-area",
    question: { ar: "هل التوصيل متاح خارج الرياض؟", en: "Do you deliver outside Riyadh?" },
    answer: {
      ar: "حاليًا التوصيل متاح داخل مدينة الرياض فقط.",
      en: "Delivery is currently available within Riyadh city only.",
    },
  },
  {
    _id: "faq-returns",
    question: { ar: "هل يمكنني استرجاع المنتج؟", en: "Can I return a product?" },
    answer: {
      ar: "نعم، يمكنك الاسترجاع خلال 7 أيام بشرط أن يكون المنتج بحالته الأصلية ولم يُفتح أو يُستخدم.",
      en: "Yes — returns are accepted within 7 days, provided the product is unopened, unused and in its original condition.",
    },
  },
  {
    _id: "faq-authenticity",
    question: { ar: "هل المنتجات أصلية؟", en: "Are the products genuine?" },
    answer: {
      ar: "نعم، جميع المنتجات أصلية من الموردين المعتمدين.",
      en: "Yes — every product is sourced from authorised suppliers.",
    },
  },
];
