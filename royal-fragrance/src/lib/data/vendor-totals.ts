import { createAdminClient } from "@/lib/supabase/server";
import type { DateRange } from "@/lib/date-range";

export interface VendorMade {
  vendorId: string;
  name: string;
  code: string;
  collections: number;
  salesValue: number;
  commission: number;
  stockValue: number;
}

/** What every vendor has collected, sold, earned and still holds, for the admin overview. */
export async function getVendorTotals(range?: DateRange) {
  const admin = createAdminClient();
  const within = (q: any, column: string) => {
    if (range?.from) q = q.gte(column, range.from.toISOString());
    if (range?.to) q = q.lt(column, range.to.toISOString());
    return q;
  };
  const [{ data: vendors }, { data: tx }, { data: sales }, { data: comm }, { data: inv }] =
    await Promise.all([
      admin.from("vendors").select("user_id, business_name, display_name, vendor_code"),
      within(
        admin
          .from("payment_transactions")
          .select("vendor_id, amount")
          .not("vendor_id", "is", null)
          .neq("status", "failed"),
        "transaction_date"
      ),
      within(
        admin
          .from("vendor_sales")
          .select(
            "vendor_id, vendor_sale_items(quantity, recorded_price, products(base_price), product_variants(price))"
          ),
        "created_at"
      ),
      within(admin.from("vendor_commissions").select("vendor_id, amount"), "created_at"),
      admin
        .from("vendor_inventory")
        .select("vendor_id, available_quantity, products(base_price), product_variants(price)"),
    ]);

  const rows = new Map<string, VendorMade>();
  for (const v of vendors ?? []) {
    rows.set(v.user_id, {
      vendorId: v.user_id,
      name: v.display_name || v.business_name,
      code: v.vendor_code,
      collections: 0,
      salesValue: 0,
      commission: 0,
      stockValue: 0,
    });
  }
  for (const t of tx ?? []) {
    const r = rows.get(t.vendor_id as string);
    if (r) r.collections += Number(t.amount);
  }
  for (const s of (sales ?? []) as any[]) {
    const r = rows.get(s.vendor_id);
    if (!r) continue;
    for (const it of s.vendor_sale_items ?? []) {
      const price =
        Number(it.recorded_price) > 0
          ? Number(it.recorded_price)
          : Number(it.product_variants?.price ?? it.products?.base_price ?? 0);
      r.salesValue += price * Number(it.quantity);
    }
  }
  for (const c of comm ?? []) {
    const r = rows.get(c.vendor_id as string);
    if (r) r.commission += Number(c.amount);
  }
  for (const i of (inv ?? []) as any[]) {
    const r = rows.get(i.vendor_id);
    if (r)
      r.stockValue +=
        i.available_quantity * Number(i.product_variants?.price ?? i.products?.base_price ?? 0);
  }

  const list = Array.from(rows.values()).sort((a, b) => b.salesValue - a.salesValue);
  const sum = (k: keyof VendorMade) => list.reduce((t, r) => t + (r[k] as number), 0);
  return {
    list,
    totals: {
      collections: sum("collections"),
      salesValue: sum("salesValue"),
      commission: sum("commission"),
      stockValue: sum("stockValue"),
    },
  };
}
