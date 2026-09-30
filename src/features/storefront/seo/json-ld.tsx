import type { SettingsView } from "src/common/types/storefront";
import { pickLocalized } from "src/lib/localized";
import { siteUrl } from "src/server/core/config/env";

/** Serialises JSON-LD safely inside a <script> (no `</script>` break-out). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function OrganizationJsonLd({ settings, locale }: { settings: SettingsView; locale: string }) {
  const base = siteUrl();
  const sameAs = Object.values(settings.social).filter(Boolean);
  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: pickLocalized(settings.storeName, locale),
          url: `${base}/${locale}`,
          ...(settings.logo?.secureUrl ? { logo: settings.logo.secureUrl } : {}),
          ...(settings.contact.email ? { email: settings.contact.email } : {}),
          ...(settings.contact.phone ? { telephone: settings.contact.phone } : {}),
          ...(settings.legal.vatNumber ? { vatID: settings.legal.vatNumber } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: pickLocalized(settings.storeName, locale),
          url: `${base}/${locale}`,
          inLanguage: locale === "ar" ? "ar-SA" : "en-SA",
          potentialAction: {
            "@type": "SearchAction",
            target: `${base}/${locale}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ]}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
      }}
    />
  );
}
