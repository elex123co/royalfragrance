import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function getCurrentVendor() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use the admin client for the read so a vendor whose profile hasn't
  // finished propagating through RLS-scoped policies still loads cleanly;
  // access to this function is already gated by middleware (role check).
  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("*, users!user_id(name, email, phone)")
    .eq("user_id", user.id)
    .single();

  return vendor;
}

export async function getVendorDashboardData(vendorId: string) {
  const supabase = createAdminClient();

  const [
    { data: collectionAccount },
    { data: transactions },
    { data: sales },
    { data: inventory },
    { data: handovers },
  ] = await Promise.all([
    supabase
      .from("vendor_collection_accounts")
      .select("*")
      .eq("vendor_id", vendorId)
      .maybeSingle(),
    supabase
      .from("payment_transactions")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("vendor_sales")
      .select(
        "*, vendor_sale_items(*, products(name, base_price), product_variants(size, price)), payment_transactions(amount, provider_transaction_reference, transaction_date)"
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_inventory")
      .select("*, products(name, base_price), product_variants(size, price)")
      .eq("vendor_id", vendorId),
    supabase
      .from("product_handovers")
      .select("*, vendor_sales(sale_number)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
  ]);

  // How much of each payment has been matched to products so far. A payment
  // stays open until the products recorded against it add up to its amount,
  // so one payment can be split across several products (or several records).
  const unitPrice = (i: any) =>
    Number(i.recorded_price) > 0
      ? Number(i.recorded_price)
      : Number(i.product_variants?.price ?? i.products?.base_price ?? 0);
  const recordedByTransaction = new Map<string, number>();
  for (const s of sales ?? []) {
    if (!s.transaction_id) continue;
    const total = (s.vendor_sale_items ?? []).reduce(
      (sum: number, i: any) => sum + unitPrice(i) * Number(i.quantity),
      0
    );
    recordedByTransaction.set(
      s.transaction_id,
      (recordedByTransaction.get(s.transaction_id) ?? 0) + total
    );
  }
  const recordedSaleTransactionIds = new Set(
    (sales ?? []).map((s: any) => s.transaction_id).filter(Boolean)
  );
  const unrecordedTransactions = (transactions ?? [])
    .filter((t) => {
      if (t.status !== "confirmed") return false;
      if (!recordedSaleTransactionIds.has(t.id)) return true;
      const recorded = recordedByTransaction.get(t.id) ?? 0;
      // recorded === 0 means an old record without prices: treat as done.
      return recorded > 0 && recorded < Number(t.amount);
    })
    .map((t) => {
      const recorded = recordedByTransaction.get(t.id) ?? 0;
      return { ...t, recorded_total: recorded, remaining: Math.max(0, Number(t.amount) - recorded) };
    });

  return {
    collectionAccount,
    transactions: transactions ?? [],
    unrecordedTransactions,
    sales: sales ?? [],
    inventory: inventory ?? [],
    handovers: handovers ?? [],
  };
}
