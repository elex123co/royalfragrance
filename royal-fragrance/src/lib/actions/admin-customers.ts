"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface DeleteCustomersResult {
  success: boolean;
  deleted: number;
  error?: string;
  failures?: string[];
}

/**
 * Permanently deletes customer accounts (login, profile, wishlist, saved
 * addresses). Only role = 'customer' rows can be deleted here: vendors and
 * admins are refused so a stray click can never remove one. Past orders are
 * kept for the business records (they carry their own name/email/phone
 * snapshot) and are simply unlinked from the deleted account.
 */
export async function deleteCustomers(userIds: string[]): Promise<DeleteCustomersResult> {
  const { userId: adminId, admin } = await requireAdmin();

  const ids = Array.from(new Set(userIds)).filter((id) => id && id !== adminId);
  if (ids.length === 0) {
    return { success: false, deleted: 0, error: "No customers selected" };
  }

  const { data: users, error: lookupError } = await admin
    .from("users")
    .select("id, email, role")
    .in("id", ids);

  if (lookupError) return { success: false, deleted: 0, error: lookupError.message };

  const deletable = (users ?? []).filter((u) => u.role === "customer");
  const skipped = ids.length - deletable.length;

  let deleted = 0;
  const failures: string[] = [];

  for (const u of deletable) {
    // Keep order history, drop the link to the account being removed.
    await admin.from("orders").update({ customer_id: null }).eq("customer_id", u.id);

    await admin.from("audit_logs").update({ actor_id: null }).eq("actor_id", u.id);

    // Deleting the auth user cascades to users, customers, wishlist, etc.
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) {
      failures.push(`${u.email}: ${error.message}`);
      continue;
    }
    deleted += 1;
  }

  if (deleted > 0) {
    await admin.from("audit_logs").insert({
      actor_id: adminId,
      action: "customer.deleted",
      entity_type: "user",
      entity_id: adminId,
      metadata: { deleted_count: deleted, deleted_emails: deletable.map((u) => u.email) },
    });
  }

  revalidatePath("/admin/customers");

  if (failures.length > 0 || skipped > 0) {
    return {
      success: deleted > 0,
      deleted,
      error:
        failures.length > 0
          ? `Some accounts could not be deleted.`
          : `${skipped} selected account(s) were skipped because they are not customers.`,
      failures,
    };
  }
  return { success: true, deleted };
}
