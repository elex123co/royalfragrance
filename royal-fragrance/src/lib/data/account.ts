import { createClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";

const ACTIVE_STATUSES = [
  "order_received",
  "payment_confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
];

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("name, email, phone")
    .eq("id", userId)
    .single();
  return data;
}

export async function getOrders(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, slug, product_images(url)))")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** The customer's fragrance collection — every distinct product they've paid for. */
export async function getCollection(userId: string) {
  const orders = await getOrders(userId);
  const paid = orders.filter((o: any) => o.payment_status === "paid");

  const byProduct = new Map<string, any>();
  for (const order of paid) {
    for (const item of order.order_items ?? []) {
      const product = item.products;
      if (!product) continue;
      const key = item.product_id;
      const existing = byProduct.get(key);
      const purchasedAt = order.created_at;
      if (!existing || purchasedAt > existing.purchasedAt) {
        byProduct.set(key, {
          productId: item.product_id,
          name: product.name,
          slug: product.slug,
          image: product.product_images?.[0]?.url ?? "",
          purchasedAt,
          timesPurchased: (existing?.timesPurchased ?? 0) + 1,
        });
      } else {
        existing.timesPurchased += 1;
      }
    }
  }
  return Array.from(byProduct.values()).sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
}

export async function getWishlist(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select(
      "id, product_id, created_at, products(name, slug, base_price, status, product_images(url), product_variants(price, stock))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function isWishlisted(userId: string, productId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function getAddresses(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  return data ?? [];
}

export async function getScentProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("scent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getNotifications(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

/**
 * Rule-based recommendations: score every active product by how many of the
 * customer's preferred scent families appear in its fragrance notes, and
 * exclude anything already owned. Falls back to featured products when
 * there's no scent profile yet or nothing scores above zero — no ML needed.
 */
export async function getRecommendations(userId: string) {
  const [scentProfile, collection] = await Promise.all([
    getScentProfile(userId),
    getCollection(userId),
  ]);
  const owned = new Set(collection.map((c) => c.productId));
  const allProducts = await getAllProducts();
  const candidates = allProducts.filter((p) => !owned.has(p.id));

  const families = scentProfile?.preferred_families ?? [];
  if (families.length === 0) {
    return candidates.slice(0, 4);
  }

  const scored = candidates
    .map((p) => {
      const noteText = [
        ...(p.notes?.top ?? []),
        ...(p.notes?.heart ?? []),
        ...(p.notes?.base ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const score = families.filter((f: string) =>
        noteText.includes(f.toLowerCase())
      ).length;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);

  const topScored = scored.filter((s) => s.score > 0).map((s) => s.product);
  return (topScored.length > 0 ? topScored : candidates).slice(0, 4);
}

export function summarizeScentProfile(profile: {
  preferred_families: string[];
  intensity: string | null;
} | null) {
  if (!profile || profile.preferred_families.length === 0) return null;
  const families = profile.preferred_families.slice(0, 3).join(", ").toLowerCase();
  const intensity = profile.intensity ? `${profile.intensity.toLowerCase()} ` : "";
  return `You enjoy ${intensity}${families} fragrances.`;
}

export function getActiveOrder(orders: any[]) {
  return orders.find((o) => ACTIVE_STATUSES.includes(o.order_status));
}
