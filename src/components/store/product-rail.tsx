import { getLocale, getTranslations } from "next-intl/server";
import type { ProductCardView } from "src/common/types/storefront";
import { Carousel } from "./carousel";
import { ProductCard } from "./product-card";
import { SectionHeading } from "./section-heading";

/** A titled horizontal carousel of product cards. CONTRACT: `<ProductRail title? subtitle? href? products locale />`. */
export async function ProductRail({
  title,
  subtitle,
  href,
  products,
  locale,
}: {
  title?: string;
  subtitle?: string;
  href?: string;
  products: ProductCardView[];
  locale?: string;
}) {
  if (products.length === 0) return null;
  const resolved = locale ?? (await getLocale());
  const t = await getTranslations({ locale: resolved, namespace: "common" });
  return (
    <section>
      {title ? <SectionHeading title={title} subtitle={subtitle} href={href} linkLabel={t("browseOffers")} /> : null}
      <Carousel dir={resolved === "ar" ? "rtl" : "ltr"} labels={{ previous: t("previous"), next: t("next") }}>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} locale={resolved} />
        ))}
      </Carousel>
    </section>
  );
}
