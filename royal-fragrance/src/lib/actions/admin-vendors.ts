"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";
import { getPaymentProvider } from "@/lib/payments";
import { sendVendorApprovedEmail } from "@/lib/email/resend";

type VendorStatus = "pending_approval" | "active" | "suspended" | "inactive";

export async function setVendorStatus(vendorId: string, status: VendorStatus) {
  const { admin: supabase } = await requireAdmin();

  const update: Record<string, unknown> = { status };
  if (status === "active") {
    update.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("vendors")
    .update(update)
    .eq("user_id", vendorId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    action: "vendor.status_changed",
    entity_type: "vendor",
    entity_id: vendorId,
    metadata: { newStatus: status },
  });

  if (status === "active") {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("users!user_id(name, email)")
      .eq("user_id", vendorId)
      .single();
    const user = (vendor as any)?.users;
    if (user?.email) {
      await sendVendorApprovedEmail(user.email, user.name ?? "there");
    }
  }

  revalidatePath("/admin/vendors");
  return { success: true };
}

/**
 * Attempts to provision a dedicated collection account for a newly
 * activated vendor. Not every provider/account tier supports this — a
 * failure here is surfaced clearly rather than silently retried forever
 * (spec section 35), and the vendor can still be approved without one.
 */
export async function provisionCollectionAccount(vendorId: string) {
  const { admin: supabase } = await requireAdmin();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, users!user_id(name, email, phone)")
    .eq("user_id", vendorId)
    .single();

  if (!vendor) return { success: false, error: "Vendor not found" };

  const user = (vendor as any).users;
  const [firstName, ...rest] = (user?.name ?? "Vendor").split(" ");

  try {
    const provider = getPaymentProvider();
    const account = await provider.createVendorCollectionAccount({
      email: user.email,
      firstName,
      lastName: rest.join(" ") || "Partner",
      phone: user.phone,
      vendorId,
    });

    const { error } = await supabase.from("vendor_collection_accounts").insert({
      vendor_id: vendorId,
      provider: provider.name,
      provider_account_reference: account.providerAccountReference,
      bank_name: account.bankName,
      account_number: account.accountNumber,
      account_name: account.accountName,
      status: "active",
    });

    if (error) return { success: false, error: error.message };

    await supabase.from("audit_logs").insert({
      action: "vendor.collection_account_assigned",
      entity_type: "vendor",
      entity_id: vendorId,
      metadata: { provider: provider.name },
    });

    revalidatePath("/admin/vendors");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ??
        "Could not provision a collection account. Vendor is still approved.",
    };
  }
}
