import { createAdminClient } from "@/lib/supabase/server";
import { CustomersTable, type CustomerRow } from "@/components/admin/CustomersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Admin — Royal Fragrance" };

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();

  const [{ data: users }, { data: orders }] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("orders").select("customer_id").not("customer_id", "is", null).limit(50000),
  ]);

  const orderCounts = new Map<string, number>();
  for (const o of orders ?? []) {
    orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) ?? 0) + 1);
  }

  const rows: CustomerRow[] = (users ?? []).map((u) => {
    const fullName = (u.name ?? "").trim();
    return {
      id: u.id,
      fullName,
      firstName: fullName.split(/\s+/)[0] ?? "",
      email: u.email,
      phone: u.phone ?? "",
      joined: u.created_at,
      orders: orderCounts.get(u.id) ?? 0,
    };
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Customers</h1>
      <p className="mb-6 text-sm text-rich/60">
        {rows.length} registered customer{rows.length === 1 ? "" : "s"}. Vendors and
        admins are not listed here.
      </p>
      <CustomersTable customers={rows} />
    </div>
  );
}
