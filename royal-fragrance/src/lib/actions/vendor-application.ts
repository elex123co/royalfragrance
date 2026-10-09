"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendVendorApplicationReceivedEmail,
  sendAdminVendorApplicationAlert,
} from "@/lib/email/resend";
import {
  MAIN_QUESTIONS,
  REFERENCE_QUESTIONS,
  STUDENT_FOLLOWUPS,
} from "@/lib/vendor-application-fields";

export interface VendorApplicationInput {
  email: string;
  password: string;
  bvn: string;
  nin: string;
  studentStatus: string; // "STUDENT" | "Other"
  studentOther: string;
  // every other question, keyed by QuestionDef.key
  answers: Record<string, string>;
}

export interface VendorApplicationResult {
  success: boolean;
  error?: string;
}

function generateVendorCode() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VEND-${rand}`;
}

const ELEVEN_DIGITS = /^\d{11}$/;

/**
 * Creates the auth user + vendor row in one server action. The vendor
 * starts as "pending_approval" and sees only a waiting screen until an
 * admin activates them (see lib/actions/admin-vendors.ts).
 */
export async function applyAsVendor(
  input: VendorApplicationInput
): Promise<VendorApplicationResult> {
  const a = input.answers ?? {};

  // Server-side validation — never trust the client for required fields.
  for (const q of [...MAIN_QUESTIONS, ...REFERENCE_QUESTIONS]) {
    if (q.required && !(a[q.key] ?? "").trim()) {
      return { success: false, error: `Please answer: ${q.label}` };
    }
  }
  if (!input.email?.trim()) return { success: false, error: "Email is required." };
  if (!input.password || input.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  if (input.studentStatus !== "STUDENT" && input.studentStatus !== "Other") {
    return { success: false, error: "Please choose STUDENT OR NOT." };
  }
  if (input.studentStatus === "Other" && !input.studentOther.trim()) {
    return { success: false, error: "Please fill in the Other option for STUDENT OR NOT." };
  }

  // BVN or NIN is compulsory (11 digits) — needed to create the vendor's
  // Monnify collection account.
  const bvn = (input.bvn ?? "").trim();
  const nin = (input.nin ?? "").trim();
  if (!bvn && !nin) {
    return { success: false, error: "BVN or NIN is compulsory. Please provide at least one." };
  }
  if (bvn && !ELEVEN_DIGITS.test(bvn)) {
    return { success: false, error: "BVN must be exactly 11 digits." };
  }
  if (nin && !ELEVEN_DIGITS.test(nin)) {
    return { success: false, error: "NIN must be exactly 11 digits." };
  }

  const supabase = createAdminClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: a.fullName.trim(),
      phone: a.phone.trim(),
      role: "vendor",
    },
  });

  if (authError || !authUser.user) {
    return { success: false, error: authError?.message ?? "Could not create account" };
  }

  const isStudent = input.studentStatus === "STUDENT";

  const answers: Record<string, string> = {};
  for (const q of [...MAIN_QUESTIONS, ...REFERENCE_QUESTIONS, ...STUDENT_FOLLOWUPS]) {
    answers[q.key] = (a[q.key] ?? "").trim();
  }
  answers.studentStatus = input.studentStatus;
  answers.studentOther = input.studentOther.trim();

  const { error: vendorError } = await supabase.from("vendors").insert({
    user_id: authUser.user.id,
    vendor_code: generateVendorCode(),
    business_name: a.fullName.trim(),
    status: "pending_approval",
    is_student: isStudent,
    university: a.university.trim(),
    primary_platform: null,
    audience_size: a.socialActivity.trim(),
    promotion_commitment: true,
    application_answers: answers,
    bvn: bvn || null,
    nin: nin || null,
  });

  if (vendorError) {
    // Roll back the orphaned auth user so the applicant can retry.
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return { success: false, error: vendorError.message };
  }

  await supabase.from("audit_logs").insert({
    action: "vendor.application_submitted",
    entity_type: "vendor",
    entity_id: authUser.user.id,
    metadata: { fullName: a.fullName },
  });

  await sendVendorApplicationReceivedEmail(input.email, a.fullName);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await sendAdminVendorApplicationAlert(adminEmail, {
      fullName: a.fullName,
      email: input.email,
      phone: a.phone,
      isStudent,
      university: a.university,
      primaryPlatform: "",
      audienceSize: a.socialActivity,
    });
  }

  return { success: true };
}
