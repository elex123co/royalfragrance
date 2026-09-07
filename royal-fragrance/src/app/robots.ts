import type { MetadataRoute } from "next";

const SITE_URL = "https://royalfragrancegallery.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/vendor",
        "/vendor/",
        "/account",
        "/account/",
        "/api/",
        "/checkout",
        "/cart",
        "/order-confirmation",
        "/dashboard",
        "/login",
        "/register",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
