"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendVendorApplicationReceivedEmail,
  sendAdminVendorApplicationAlert,
} from "@/lib/email/resend";

export interface VendorApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  notes: string;
  isStudent: boolean;
  university: string;
  primaryPlatform: string;
  audienceSize: string;
  promotionCommitment: boolean;
}

export interface VendorApplicationResult {
  success: boolean;
  error?: string;
}

function generateVendorCode() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VEND-${rand}`;
}

/**
 * Creates the auth user + vendor row in one server action. The vendor
 * starts as "pending_approval" — only an admin activating them (see
 * lib/actions/admin-vendors.ts) unlocks selling and collection features,
 * per spec section 17.
 */
export async function applyAsVendor(
  input: VendorApplicationInput
): Promise<VendorApplicationResult> {
  const supabase = createAdminClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.fullName,
      phone: input.phone,
      role: "vendor",
    },
  });

  if (authError || !authUser.user) {
    return { success: false, error: authError?.message ?? "Could not create account" };
  }

  // The `on_auth_user_created` trigger has already inserted the base
  // `users` row with role='vendor'. Now create the vendor-specific record.
  const { error: vendorError } = await supabase.from("vendors").insert({
    user_id: authUser.user.id,
    vendor_code: generateVendorCode(),
    business_name: input.fullName,
    status: "pending_approval",
    onboarding_notes: input.notes,
    is_student: input.isStudent,
    university: input.isStudent ? input.university : null,
    primary_platform: input.primaryPlatform,
    audience_size: input.audienceSize,
    promotion_commitment: input.promotionCommitment,
  });

  if (vendorError) {
    return { success: false, error: vendorError.message };
  }

  await supabase.from("audit_logs").insert({
    action: "vendor.application_submitted",
    entity_type: "vendor",
    entity_id: authUser.user.id,
    metadata: { fullName: input.fullName },
  });

  await sendVendorApplicationReceivedEmail(input.email, input.fullName);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await sendAdminVendorApplicationAlert(adminEmail, {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      isStudent: input.isStudent,
      university: input.university,
      primaryPlatform: input.primaryPlatform,
      audienceSize: input.audienceSize,
    });
  }

  return { success: true };
}
