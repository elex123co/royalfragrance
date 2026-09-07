import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const SITE_URL = "https://royalfragrancegallery.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/future`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/become-a-vendor`, changeFrequency: "monthly", priority: 0.5 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active");

    productPages = (products ?? []).map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // If the DB is briefly unreachable, still return the static pages
    // rather than failing the whole sitemap.
  }

  return [...staticPages, ...productPages];
}
