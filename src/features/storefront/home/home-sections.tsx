import { Plus, Quote, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { HomeSectionType } from "src/common/enums";
import type { HomeSectionView, SettingsView } from "src/common/types/storefront";
import { Carousel } from "src/components/store/carousel";
import { Countdown } from "src/components/store/countdown";
import { Price } from "src/components/store/price";
import { ProductCard } from "src/components/store/product-card";
import { ProductRail } from "src/components/store/product-rail";
import { SectionHeading } from "src/components/store/section-heading";
import { SmartLink } from "src/components/store/smart-link";
import { StoreImage } from "src/components/store/store-image";
import { SocialIcons } from "src/features/storefront/shell/social-icons";
import { Link } from "src/i18n/navigation";
import { pickLocalized, pickSlug } from "src/lib/localized";
import { AddToCartButton } from "src/components/store/add-to-cart-button";
import { BranchMap } from "./branch-map";
import { CopyCode } from "./copy-code";
import { HeroSlider } from "./hero-slider";
import { Reveal } from "./reveal";

/** Renders the admin-ordered home sections, each by its type. */
export async function HomeSections({ sections, settings, locale }: { sections: HomeSectionView[]; settings: SettingsView; locale: string }) {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const dir = locale === "ar" ? "rtl" : "ltr";
  const labels = { previous: tc("previous"), next: tc("next") };
  const L = (value: { ar: string; en: string }) => pickLocalized(value, locale);

  const render = (section: HomeSectionView) => {
    const title = L(section.title);
    switch (section.type) {
      case HomeSectionType.HERO_SLIDER:
        return <HeroSlider items={section.items} dir={dir} />;

      case HomeSectionType.TILE_ROW:
        return (
          <section>
            <SectionHeading title={title} align="start" />
            <Carousel dir={dir} labels={labels} slideClassName="basis-[42%] sm:basis-[28%] lg:basis-[15.5%]">
              {section.items.map((item) => (
                <SmartLink key={item._id} href={item.href} className="group block text-center">
                  <span className="relative block aspect-[186/250] overflow-hidden rounded-card bg-brand-deep">
                    <StoreImage image={item.image} alt={L(item.title)} sizes="(min-width: 1024px) 15vw, 42vw" fit="cover" className="transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  {L(item.title) ? <span className="mt-2 block text-sm font-bold text-ink">{L(item.title)}</span> : null}
                  {L(item.subtitle) ? <span className="block text-xs text-ink-soft">{L(item.subtitle)}</span> : null}
                </SmartLink>
              ))}
            </Carousel>
          </section>
        );

      case HomeSectionType.BANNER:
        return (
          <section>
            <SectionHeading title={title} align="start" />
            <div className={`grid gap-3 ${section.items.length === 1 ? "" : section.items.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
              {section.items.map((item) => (
                <SmartLink key={item._id} href={item.href} className="relative block overflow-hidden rounded-card">
                  <span className="relative block aspect-[16/7] w-full">
                    <StoreImage image={item.image} alt={L(item.title)} sizes="(min-width: 1024px) 33vw, 50vw" fit="cover" />
                  </span>
                </SmartLink>
              ))}
            </div>
          </section>
        );

      case HomeSectionType.BRAND_CAROUSEL:
        if (section.brands.length === 0) return null;
        return (
          <section>
            <SectionHeading title={title || t("brandsTitle")} subtitle={title ? undefined : t("brandsSubtitle")} />
            <Carousel dir={dir} labels={labels} slideClassName="basis-[30%] sm:basis-[20%] lg:basis-[12.5%]" autoplayMs={3500} showProgress={false}>
              {section.brands.map((brand) => (
                <Link key={brand._id} href={`/brands/${pickSlug(brand.slug, locale)}`} className="grid aspect-[3/2] place-items-center rounded-card bg-card p-3 shadow-card" aria-label={L(brand.name)}>
                  {brand.logo?.secureUrl ? (
                    <span className="relative size-full">
                      <Image src={brand.logo.secureUrl} alt={L(brand.name)} fill sizes="160px" className="object-contain" />
                    </span>
                  ) : (
                    <span className="text-center text-sm font-semibold text-ink-soft">{L(brand.name)}</span>
                  )}
                </Link>
              ))}
            </Carousel>
          </section>
        );

      case HomeSectionType.SPOTLIGHT: {
        const product = section.products[0];
        if (!product) return null;
        const name = L(product.name);
        return (
          <section className="grid overflow-hidden rounded-card bg-card shadow-card md:grid-cols-2">
            <div className="relative aspect-square bg-brand-deep md:aspect-auto md:min-h-96">
              {section.videoUrl ? (
                <video src={section.videoUrl} className="absolute inset-0 size-full object-cover" autoPlay muted loop playsInline preload="none" aria-label={name} />
              ) : (
                <StoreImage image={product.image} alt={name} sizes="(min-width: 768px) 50vw, 100vw" className="p-8" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
              {title ? <p className="text-sm font-semibold text-brand-dark">{title}</p> : null}
              <h2 className="text-2xl font-bold leading-snug text-ink md:text-3xl">
                <Link href={`/products/${pickSlug(product.slug, locale)}`} className="hover:text-brand-dark">{name}</Link>
              </h2>
              <Price value={product.price} compareAt={product.compareAtPrice} locale={locale} size="lg" />
              {section.endsAt ? (
                <div className="space-y-1.5">
                  <p className="text-sm text-ink-soft">{tc("offerEndsIn")}</p>
                  <Countdown endsAt={section.endsAt} />
                </div>
              ) : null}
              {section.couponCode ? (
                <div className="space-y-1.5">
                  <p className="text-sm text-ink-soft">{t("spotlightCoupon")}</p>
                  <CopyCode code={section.couponCode} />
                </div>
              ) : null}
              <div className="max-w-xs">
                <AddToCartButton productId={product._id} productName={name} slug={pickSlug(product.slug, locale)} inStock={product.inStock} needsOptions={product.hasRequiredOptions} />
              </div>
            </div>
          </section>
        );
      }

      case HomeSectionType.PRODUCT_RAIL:
        return (
          <ProductRail
            title={title}
            href={section.category ? `/categories/${pickSlug(section.category.slug, locale)}` : undefined}
            products={section.products}
            locale={locale}
          />
        );

      case HomeSectionType.TRUST_STRIP:
        return (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {section.items.map((item) => (
              <div key={item._id} className="flex flex-col items-center gap-2 rounded-card bg-card p-5 text-center shadow-card">
                {item.image?.secureUrl ? (
                  <span className="relative size-12">
                    <Image src={item.image.secureUrl} alt="" fill sizes="48px" className="object-contain" />
                  </span>
                ) : null}
                <p className="text-sm font-bold text-ink">{L(item.title)}</p>
                {L(item.subtitle) ? <p className="text-xs text-ink-soft">{L(item.subtitle)}</p> : null}
              </div>
            ))}
          </section>
        );

      case HomeSectionType.SOCIAL_LINKS:
        return (
          <section className="flex flex-col items-center gap-3 text-center">
            <p className="font-bold text-ink">{title || t("followUs")}</p>
            <SocialIcons social={settings.social} size="lg" />
          </section>
        );

      case HomeSectionType.FAQ:
        if (section.faqs.length === 0) return null;
        return (
          <section>
            <SectionHeading title={title || t("faqTitle")} subtitle={t("faqSubtitle")} />
            <div className="grid gap-3 md:grid-cols-2">
              {section.faqs.map((faq) => (
                <details key={faq._id} className="group rounded-card bg-band/60 open:bg-card open:shadow-card">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {L(faq.question)}
                    <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <div className="rich-text px-5 pb-5 text-sm text-ink-soft" dangerouslySetInnerHTML={{ __html: L(faq.answer) }} />
                </details>
              ))}
            </div>
          </section>
        );

      case HomeSectionType.BLOG_RAIL:
        if (section.posts.length === 0) return null;
        return (
          <section>
            <SectionHeading title={title || t("blogTitle")} subtitle={t("blogSubtitle")} href="/blog" linkLabel={tc("viewAll")} align="start" />
            <Carousel dir={dir} labels={labels} slideClassName="basis-[85%] sm:basis-[48%] lg:basis-[32%]">
              {section.posts.map((post) => (
                <article key={post._id} className="flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card">
                  <span className="relative block aspect-[16/9] bg-band">
                    <StoreImage image={post.cover} alt={L(post.title)} sizes="(min-width: 1024px) 32vw, 85vw" fit="cover" />
                  </span>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-bold text-ink">{L(post.title)}</h3>
                    <p className="line-clamp-3 text-sm text-ink-soft">{L(post.excerpt)}</p>
                    <Link href={`/blog/${pickSlug(post.slug, locale)}`} className="mt-auto block rounded-card bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark">
                      {tc("readMore")}
                    </Link>
                  </div>
                </article>
              ))}
            </Carousel>
          </section>
        );

      case HomeSectionType.TESTIMONIALS:
        if (section.testimonials.length === 0) return null;
        return (
          <section>
            <SectionHeading title={title || t("testimonialsTitle")} align="start" />
            <Carousel dir={dir} labels={labels} slideClassName="basis-[80%] sm:basis-[45%] lg:basis-[28%]">
              {section.testimonials.map((item) => (
                <figure key={item._id} className="relative flex h-full flex-col items-center gap-3 rounded-card bg-card p-6 text-center shadow-card">
                  <Quote className="absolute start-5 top-5 size-6 text-line" aria-hidden="true" />
                  <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-xl font-bold text-brand-deep">{item.authorName.slice(0, 1)}</span>
                  <figcaption className="font-bold text-ink">{item.authorName}</figcaption>
                  <span className="flex gap-0.5" aria-label={`${item.rating}/5`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className={`size-4 ${index < item.rating ? "fill-star text-star" : "text-line"}`} aria-hidden="true" />
                    ))}
                  </span>
                  <blockquote className="text-sm text-ink-soft">{L(item.body)}</blockquote>
                </figure>
              ))}
            </Carousel>
          </section>
        );

      case HomeSectionType.BRANCH_MAP:
        return <BranchMap branches={settings.branches} title={title || t("branchesTitle")} locale={locale} />;
    }
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-3 py-6 md:gap-16 md:px-4">
      {sections.map((section, index) => {
        const content = render(section);
        if (!content) return null;
        return index === 0 ? <div key={section._id}>{content}</div> : <Reveal key={section._id}>{content}</Reveal>;
      })}
    </div>
  );
}

export { ProductCard };
