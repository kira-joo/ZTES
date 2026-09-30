import type { MetadataRoute } from "next";
import { siteUrl } from "src/server/core/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/*/cart", "/*/checkout", "/*/orders", "/*/wishlist"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
