import { getAllProducts } from "@/lib/data/products";

const SITE_URL = "https://royalfragrancegallery.com";

/**
 * Serves a CSV product feed in Meta's required format for Commerce Manager.
 * Give Meta this URL as a "Scheduled feed" (Commerce Manager → Data Sources
 * → Add Items → Data Feed → Set a schedule) and it will re-fetch this on
 * its own — hourly, daily, or weekly — automatically keeping your Facebook/
 * Instagram catalog in sync with whatever's actually live on the site.
 * No manual re-upload needed, ever, for products added/edited/removed later.
 *
 * Required fields per Meta's spec: id, title, description, availability,
 * condition, price, link, image_link, brand.
 * Reference: https://developers.facebook.com/documentation/ads-commerce/catalog/reference
 */
function csvEscape(value: string): string {
  const stripped = value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (stripped.includes(",") || stripped.includes('"') || stripped.includes("\n")) {
    return `"${stripped.replace(/"/g, '""')}"`;
  }
  return stripped;
}

export async function GET() {
  const products = await getAllProducts();
  const activeProducts = products.filter((p) => p.status !== "draft");

  const header = "id,title,description,availability,condition,price,link,image_link,brand";

  const rows = activeProducts.map((p) => {
    const inStock =
      p.status === "active" && (!p.variants?.length || p.variants.some((v) => v.stock > 0));

    return [
      p.id,
      csvEscape(p.name),
      csvEscape(p.description || p.shortDescription || p.name),
      inStock ? "in stock" : "out of stock",
      "new",
      `${p.price} NGN`,
      `${SITE_URL}/product/${p.slug}`,
      p.image || "",
      "Royal Fragrance",
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // Meta re-fetches this on its own schedule — no browser/CDN caching
      // needed, and stale caching here would defeat the whole point.
      "Cache-Control": "no-store",
    },
  });
}
