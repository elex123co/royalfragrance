import { createClient } from "@/lib/supabase/server";

export interface DeliveryZone {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
  fee: number;
}

const FALLBACK_ZONES: DeliveryZone[] = [
  { id: "lagos", name: "Lagos", state: "Lagos", city: null, fee: 2000 },
  { id: "outside-lagos", name: "Outside Lagos", state: null, city: null, fee: 5000 },
];

/**
 * Delivery pricing is admin-configurable via the `delivery_zones` table.
 * Falls back to a sensible default while the table is being set up.
 */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("id, name, state, city, fee")
      .eq("active", true)
      .order("fee", { ascending: true });

    if (error || !data || data.length === 0) return FALLBACK_ZONES;
    return data.map((z) => ({ ...z, fee: Number(z.fee) }));
  } catch {
    return FALLBACK_ZONES;
  }
}
