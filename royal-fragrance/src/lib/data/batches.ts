import { createAdminClient } from "@/lib/supabase/server";

export interface BatchLocation {
  id: string;
  name: string;
  state: string;
  batch_fee: number;
  individual_fee: number;
  active: boolean;
}

export interface BatchSummary {
  id: string;
  label: string | null;
  cycle: "weekly" | "monthly" | "custom";
  closes_at: string;
  max_members: number;
  status: "open" | "closed" | "delivered" | "cancelled";
  created_by: string | null;
  created_by_role: "admin" | "vendor";
  location: BatchLocation;
  members: number;
  share: number;
}

/** Each member's share of the batch fee. Rounded up to whole naira. */
export function batchShare(batchFee: number, maxMembers: number) {
  return Math.ceil(batchFee / Math.max(1, maxMembers));
}

// A paid order always holds a slot; an unpaid one holds it for 30 minutes.
const PENDING_HOLD_MS = 30 * 60 * 1000;

function countsAsMember(o: any) {
  if (o.batch_switched_at) return false;
  if (o.payment_status === "paid") return true;
  if (o.payment_status === "pending") {
    return Date.now() - new Date(o.created_at).getTime() < PENDING_HOLD_MS;
  }
  return false;
}

export async function getBatchLocations(onlyActive = false): Promise<BatchLocation[]> {
  const admin = createAdminClient();
  let q = admin.from("batch_locations").select("*").order("name");
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []).map((l: any) => ({
    ...l,
    batch_fee: Number(l.batch_fee),
    individual_fee: Number(l.individual_fee),
  }));
}

async function hydrate(rows: any[]): Promise<BatchSummary[]> {
  if (rows.length === 0) return [];
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("batch_id, payment_status, created_at, batch_switched_at")
    .in("batch_id", rows.map((r) => r.id));
  const counts = new Map<string, number>();
  for (const o of orders ?? []) {
    if (countsAsMember(o)) counts.set(o.batch_id, (counts.get(o.batch_id) ?? 0) + 1);
  }
  return rows.map((r) => {
    const location = {
      ...r.batch_locations,
      batch_fee: Number(r.batch_locations.batch_fee),
      individual_fee: Number(r.batch_locations.individual_fee),
    } as BatchLocation;
    return {
      id: r.id,
      label: r.label,
      cycle: r.cycle,
      closes_at: r.closes_at,
      max_members: r.max_members,
      status: r.status,
      created_by: r.created_by,
      created_by_role: r.created_by_role,
      location,
      members: counts.get(r.id) ?? 0,
      share: batchShare(location.batch_fee, r.max_members),
    };
  });
}

const SELECT = "*, batch_locations(*)";

/** Batches a customer can still join right now. */
export async function getOpenBatches(): Promise<BatchSummary[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("delivery_batches")
    .select(SELECT)
    .eq("status", "open")
    .gt("closes_at", new Date().toISOString())
    .order("closes_at");
  const all = await hydrate(data ?? []);
  return all.filter((b) => b.location.active && b.members < b.max_members);
}

export async function getBatchById(id: string): Promise<BatchSummary | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("delivery_batches").select(SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  return (await hydrate([data]))[0];
}

/** All batches (admin) or one creator's batches (vendor), newest first. */
export async function getBatchesList(createdBy?: string): Promise<BatchSummary[]> {
  const admin = createAdminClient();
  let q = admin.from("delivery_batches").select(SELECT).order("created_at", { ascending: false }).limit(100);
  if (createdBy) q = q.eq("created_by", createdBy);
  const { data } = await q;
  return hydrate(data ?? []);
}

export async function getBatchMembers(batchIds: string[]) {
  if (batchIds.length === 0) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, order_number, batch_id, customer_name, customer_phone, delivery_address, payment_status, created_at, batch_switched_at")
    .in("batch_id", batchIds)
    .order("created_at");
  return (data ?? []).filter((o: any) => o.payment_status === "paid" || o.batch_switched_at);
}
