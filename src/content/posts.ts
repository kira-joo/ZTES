/**
 * Static blog content — original short articles, not the reference site's
 * copyrighted editorial text. See docs/implementation-plan.md's "Scope
 * correction".
 */
import type { PostView } from "src/common/types/storefront";

export const POSTS: PostView[] = [
  {
    _id: "post-bed-bugs",
    title: { ar: "بق الفراش: علامات الإصابة وطرق الوقاية", en: "Bed Bugs: Signs of Infestation and How to Prevent Them" },
    slug: { ar: "bed-bugs-signs-and-prevention", en: "bed-bugs-signs-and-prevention" },
    excerpt: {
      ar: "بق الفراش حشرة صغيرة يصعب ملاحظتها في بدايتها. إليك أهم العلامات وطرق الوقاية البسيطة.",
      en: "Bed bugs are small and easy to miss early on. Here are the key signs and simple ways to prevent them.",
    },
    body: {
      ar: "<p>بق الفراش حشرة صغيرة مسطحة تختبئ عادة بالقرب من أماكن النوم: المراتب، هياكل الأسرة، والكنب. وجودها لا يعني بالضرورة عدم النظافة — فقد تنتقل مع حقائب السفر أو الأثاث المستعمل.</p><p>من أبرز العلامات: لدغات صغيرة متجمعة على الجلد، بقع دموية صغيرة على الملاءات، أو رائحة غير معتادة بالقرب من الفراش.</p><p>للوقاية: افحص الأمتعة بعد السفر، تجنب اقتناء أثاث مستعمل دون فحصه، واغسل الملاءات بماء ساخن بشكل دوري. عند الاشتباه بإصابة، يفضل استخدام مبيد مخصص لبق الفراش بدلًا من الرش العشوائي.</p>",
      en: "<p>Bed bugs are small, flat insects that typically hide near sleeping areas: mattresses, bed frames and sofas. Finding them doesn't mean a home is unclean — they often travel in luggage or secondhand furniture.</p><p>Common signs include small clustered bites on the skin, tiny blood spots on sheets, or an unusual smell near the bed.</p><p>To prevent them: check luggage after travel, inspect secondhand furniture before bringing it home, and wash bedding in hot water regularly. If you suspect an infestation, a bed-bug-specific pesticide is more effective than random spraying.</p>",
    },
    cover: null,
    publishedAt: new Date("2026-08-15").toISOString(),
    seo: {
      title: { ar: "بق الفراش: علامات الإصابة وطرق الوقاية", en: "Bed Bugs: Signs and Prevention" },
      description: { ar: "أهم علامات الإصابة ببق الفراش وطرق الوقاية البسيطة في المنزل.", en: "Key signs of a bed bug infestation and simple home prevention tips." },
    },
  },
  {
    _id: "post-cockroach-prevention",
    title: { ar: "كيف تمنع دخول الصراصير إلى منزلك", en: "How to Keep Cockroaches Out of Your Home" },
    slug: { ar: "keep-cockroaches-out", en: "keep-cockroaches-out" },
    excerpt: {
      ar: "الصراصير تدخل المنزل بحثًا عن الماء والغذاء. خطوات بسيطة تقلل من فرص دخولها.",
      en: "Cockroaches come inside looking for water and food. A few simple habits cut the odds of an infestation.",
    },
    body: {
      ar: "<p>الصراصير تنجذب لمصادر الماء والغذاء المتاحة بسهولة. أغلب الإصابات تبدأ من نقاط دخول صغيرة كالفتحات حول الأنابيب أو تحت الأبواب.</p><p>خطوات وقائية فعالة: أغلق مصادر تسرب المياه، لا تترك أطباقًا أو بقايا طعام مكشوفة، وسدّ الفتحات والشقوق حول الأنابيب والنوافذ.</p><p>إذا لوحظ نشاط للصراصير، يفضل استخدام مبيد مخصص مع التركيز على أماكن الاختباء مثل خلف الأجهزة وتحت الأحواض، بدلًا من الرش العشوائي في كل مكان.</p>",
      en: "<p>Cockroaches are drawn to easy sources of water and food. Most infestations start at small entry points — gaps around pipes, or under doors.</p><p>Effective prevention: fix water leaks promptly, avoid leaving dishes or food scraps out, and seal gaps around pipes and windows.</p><p>If activity is spotted, targeting hiding spots — behind appliances, under sinks — with a dedicated pesticide works better than spraying everywhere at once.</p>",
    },
    cover: null,
    publishedAt: new Date("2026-08-01").toISOString(),
    seo: {
      title: { ar: "كيف تمنع دخول الصراصير إلى منزلك", en: "How to Keep Cockroaches Out" },
      description: { ar: "خطوات عملية لمنع دخول الصراصير ومكافحتها في المنزل.", en: "Practical steps to prevent and control cockroaches at home." },
    },
  },
];
