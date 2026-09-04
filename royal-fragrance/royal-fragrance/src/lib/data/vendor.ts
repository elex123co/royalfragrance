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
    .select("*, users(name, email, phone)")
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
      .select("*, vendor_sale_items(*, products(name)), payment_transactions(amount)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_inventory")
      .select("*, products(name), product_variants(size)")
      .eq("vendor_id", vendorId),
    supabase
      .from("product_handovers")
      .select("*, vendor_sales(sale_number)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
  ]);

  const recordedSaleTransactionIds = new Set(
    (sales ?? []).map((s: any) => s.transaction_id).filter(Boolean)
  );
  const unrecordedTransactions = (transactions ?? []).filter(
    (t) => t.status === "confirmed" && !recordedSaleTransactionIds.has(t.id)
  );

  return {
    collectionAccount,
    transactions: transactions ?? [],
    unrecordedTransactions,
    sales: sales ?? [],
    inventory: inventory ?? [],
    handovers: handovers ?? [],
  };
}
