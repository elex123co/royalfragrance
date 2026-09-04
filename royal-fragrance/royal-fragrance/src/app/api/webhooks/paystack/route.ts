import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Paystack webhook receiver.
 *
 * Security rules this route follows (spec sections 20 & 28):
 *   1. Never trust the frontend for payment confirmation.
 *   2. Verify the signature before treating the payload as valid.
 *   3. Use the provider transaction reference as a unique constraint to
 *      prevent duplicate processing (see `payment_transactions` unique
 *      index on (provider, provider_transaction_reference)).
 *   4. Only mark an order paid after this verified confirmation.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const provider = getPaymentProvider();
  const verification = provider.verifyWebhookSignature(rawBody, signature);

  if (!verification.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = verification.event;
  const data = verification.data as any;

  // Only act on successful charge events; log everything else and ack.
  if (event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const reference: string = data.reference;
  const amountNaira: number = data.amount / 100;
  const metadata = data.metadata ?? {};

  // Idempotency: the unique (provider, provider_transaction_reference)
  // constraint on payment_transactions rejects a duplicate insert outright.
  const { data: existing } = await supabase
    .from("payment_transactions")
    .select("id")
    .eq("provider", "paystack")
    .eq("provider_transaction_reference", reference)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Determine whether this reference belongs to a customer order or a
  // vendor collection account payment, per spec section 29's distinction.
  const orderNumber: string | undefined = metadata.orderNumber ?? reference;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, order_number")
    .eq("order_number", orderNumber)
    .maybeSingle();

  let vendorId: string | null = null;
  if (!order) {
    // Not tied to an order — check whether it landed in a vendor's
    // dedicated collection account.
    const accountRef: string | undefined = data.authorization?.receiver_bank_account_number
      ? data.authorization.receiver_bank_account_number
      : undefined;

    if (accountRef) {
      const { data: account } = await supabase
        .from("vendor_collection_accounts")
        .select("vendor_id")
        .eq("account_number", accountRef)
        .maybeSingle();
      vendorId = account?.vendor_id ?? null;
    }
  }

  const { error: txError } = await supabase.from("payment_transactions").insert({
    provider: "paystack",
    provider_transaction_reference: reference,
    vendor_id: vendorId,
    order_id: order?.id ?? null,
    amount: amountNaira,
    status: "confirmed",
    payer_name: data.customer?.first_name
      ? `${data.customer.first_name} ${data.customer.last_name ?? ""}`.trim()
      : null,
    payer_phone: data.customer?.phone ?? null,
    raw_payload: data,
    transaction_date: data.paid_at ?? new Date().toISOString(),
  });

  if (txError) {
    console.error("Failed to record payment transaction:", txError);
    return NextResponse.json({ error: "Could not record transaction" }, { status: 500 });
  }

  if (order) {
    await supabase
      .from("orders")
      .update({ payment_status: "paid", order_status: "payment_confirmed" })
      .eq("id", order.id);

    await supabase.from("audit_logs").insert({
      action: "order.payment_confirmed",
      entity_type: "order",
      entity_id: order.id,
      metadata: { reference, amountNaira },
    });

    if (order.customer_id) {
      await supabase.from("notifications").insert({
        user_id: order.customer_id,
        message: `Your order ${order.order_number} has been confirmed.`,
        link: `/order-confirmation?order=${order.order_number}`,
      });
    }
  }

  return NextResponse.json({ received: true });
}
