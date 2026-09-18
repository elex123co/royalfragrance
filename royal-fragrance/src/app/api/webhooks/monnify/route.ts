import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { monnifyProvider } from "@/lib/payments/monnify";
import { confirmOrderPaidAndDeductStock } from "@/lib/orders/confirm-payment";

/**
 * Monnify webhook receiver — mirrors the same security rules as the
 * Paystack route (verify signature, idempotent via unique transaction
 * reference, never trust the frontend), adapted to Monnify's actual event
 * shape: { eventType, eventData: { paymentReference, amountPaid,
 * paymentStatus, customer, paidOn, destinationAccountInformation, ... } }.
 * Unlike Paystack, Monnify amounts are already in Naira, not kobo.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");

  const verification = monnifyProvider.verifyWebhookSignature(rawBody, signature);

  if (!verification.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (verification.event !== "SUCCESSFUL_TRANSACTION") {
    return NextResponse.json({ received: true });
  }

  const data = verification.data as any;
  const supabase = createAdminClient();
  const reference: string = data.paymentReference;
  const amountNaira: number = Number(data.amountPaid ?? 0);

  const { data: existing } = await supabase
    .from("payment_transactions")
    .select("id")
    .eq("provider", "monnify")
    .eq("provider_transaction_reference", reference)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, order_number")
    .eq("order_number", reference)
    .maybeSingle();

  let vendorId: string | null = null;
  if (!order) {
    const accountNumber: string | undefined =
      data.destinationAccountInformation?.accountNumber;
    if (accountNumber) {
      const { data: account } = await supabase
        .from("vendor_collection_accounts")
        .select("vendor_id")
        .eq("account_number", accountNumber)
        .maybeSingle();
      vendorId = account?.vendor_id ?? null;
    }
  }

  // The actual sender's details — NOT "customer", which in Monnify's
  // payload refers to who the reserved account itself belongs to (our
  // vendor), not who sent the money. The real payer is here instead.
  const source = data.paymentSourceInformation?.[0];

  const { error: txError } = await supabase.from("payment_transactions").insert({
    provider: "monnify",
    provider_transaction_reference: reference,
    vendor_id: vendorId,
    order_id: order?.id ?? null,
    amount: amountNaira,
    status: "confirmed",
    payer_name: source?.accountName ?? null,
    payer_phone: null,
    raw_payload: data,
    transaction_date: data.paidOn ?? new Date().toISOString(),
  });

  if (txError) {
    console.error("Failed to record payment transaction:", txError);
    return NextResponse.json({ error: "Could not record transaction" }, { status: 500 });
  }

  if (order) {
    await confirmOrderPaidAndDeductStock(supabase, order.id);
  }

  return NextResponse.json({ received: true });
}
