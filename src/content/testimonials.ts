/**
 * Static testimonial content. The quotes below are adapted from genuine
 * reference-site customer feedback (generic satisfaction/delivery-speed
 * remarks), but deliberately stripped of the real reviewers' names — showing
 * a real named individual as a ZTES customer they never were would be a
 * fabricated endorsement. See docs/implementation-plan.md's "Scope correction".
 */
import type { TestimonialView } from "src/common/types/storefront";

export const TESTIMONIALS: TestimonialView[] = [
  {
    _id: "t1",
    authorName: "عميل، الرياض",
    body: { ar: "رائع جدا وسرعه في التوصيل، للأمانة أشكرهم.", en: "Excellent, and delivery was fast. Thank you!" },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t2",
    authorName: "عميلة، الرياض",
    body: { ar: "الجودة ممتازة والتوصيل سريع.", en: "Great quality and fast delivery." },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t3",
    authorName: "عميل، الرياض",
    body: { ar: "متجر رائع ومتنوع، والتوصيل سريع. موفقين إن شاء الله.", en: "A great, well-stocked store with fast delivery. Wishing them continued success." },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t4",
    authorName: "عميلة، الرياض",
    body: { ar: "كانت التجربة رائعة، وخدمة التوصيل أروع. شكرًا على سرعة توصيل الطلب.", en: "A great experience — the delivery service was even better. Thanks for the fast delivery." },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t5",
    authorName: "عميل، الرياض",
    body: {
      ar: "من ناحية التوصيل: سريع. من ناحية خدمة العملاء: تجاوب سريع ومفيد. من ناحية المنتج: فعّال ويستاهل كل ريال فيه.",
      en: "Delivery: fast. Customer service: quick and helpful replies. The product: genuinely effective — worth every riyal.",
    },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t6",
    authorName: "عميل، الرياض",
    body: { ar: "ممتاز وسريع في التوصيل.", en: "Excellent, and delivery was quick." },
    rating: 4,
    avatar: null,
  },
  {
    _id: "t7",
    authorName: "عميلة، الرياض",
    body: { ar: "ممتازة جدًا والله يوفقكم.", en: "Very good — wishing you continued success." },
    rating: 5,
    avatar: null,
  },
  {
    _id: "t8",
    authorName: "عميل، الرياض",
    body: { ar: "رائع جدًا ورائحته خفيفة جدًا.", en: "Really great, and the scent is very light." },
    rating: 5,
    avatar: null,
  },
];
