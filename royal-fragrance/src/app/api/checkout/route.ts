import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { validatePromoCodeServerSide } from "@/lib/utils/promo-validation";

const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  delivery: z.object({
    state: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(5),
    zoneId: z.string().optional(),
    fee: z.number().min(0),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        name: z.string(),
        // min(0), not positive() — combo items include ₦0 lines by
        // design (the combo's total price sits on one line, the rest of
        // its bundled products are priced at 0 but still fulfil and
        // deduct stock normally).
        price: z.number().min(0),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  promoCode: z.string().optional(),
});

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RF-${stamp}${rand}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customer, delivery, items, promoCode } = parsed.data;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const supabase = createAdminClient();

  // Re-verify the promo code from scratch here — never trust a discount
  // amount computed client-side. If the code became invalid between the
  // customer applying it and submitting (expired, used up, disabled),
  // checkout simply proceeds without a discount rather than failing.
  let discountAmount = 0;
  let promoCodeId: string | null = null;
  if (promoCode) {
    const validation = await validatePromoCodeServerSide(
      supabase,
      promoCode,
      items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
      customer.email
    );
    if (validation.valid) {
      discountAmount = validation.discountAmount ?? 0;
      promoCodeId = validation.promoCodeId ?? null;
    }
  }

  const total = subtotal + delivery.fee - discountAmount;
  const orderNumber = generateOrderNumber();

  // New-customer first-order discount — automatic, no code needed.
  // Only for a genuinely logged-in account (matches "new users who log
  // into the website"), never stacked on top of a manually-entered promo
  // code, and only while the admin toggle is on and not past its optional
  // end date.
  let newUserDiscountApplied = false;
  let loggedInUserId: string | null = null;
  if (discountAmount === 0) {
    const sessionClient = createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (user) {
      loggedInUserId = user.id;
      const { data: settings } = await supabase
        .from("new_user_discount_settings")
        .select("*")
        .eq("id", 1)
        .single();

      const notExpired = !settings?.expires_at || new Date(settings.expires_at) > new Date();

      if (settings?.enabled && notExpired) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id)
          .eq("payment_status", "paid");

        if ((count ?? 0) === 0) {
          const percent = Number(settings.discount_percentage);
          discountAmount = Math.round(subtotal * (percent / 100));
          newUserDiscountApplied = true;
        }
      }
    }
  }

  const finalTotal = subtotal + delivery.fee - discountAmount;

  // Validate stock BEFORE creating the order — prevents overselling on
  // items that have sold out between the customer adding to cart and
  // checking out.
  const itemsWithVariant = items.filter((i) => i.variantId);
  if (itemsWithVariant.length > 0) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, stock, size")
      .in(
        "id",
        itemsWithVariant.map((i) => i.variantId!)
      );

    for (const item of itemsWithVariant) {
      const variant = variants?.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `${item.name}${variant ? ` (${variant.size})` : ""} — only ${variant?.stock ?? 0} left in stock. Please update your cart.`,
          },
          { status: 409 }
        );
      }
    }
  }

  // Attribute this order to a vendor's affiliate link, if the customer
  // arrived via one (see middleware.ts, which sets this cookie from a
  // ?ref=<vendor_code> URL param). Only active, real vendors count.
  let referredByVendorId: string | null = null;
  const refCode = cookies().get("rf_ref")?.value;
  if (refCode) {
    const { data: referringVendor } = await supabase
      .from("vendors")
      .select("user_id")
      .eq("vendor_code", refCode)
      .eq("status", "active")
      .maybeSingle();
    referredByVendorId = referringVendor?.user_id ?? null;
  }

  // Persist the order + items BEFORE redirecting to payment, so we have a
  // record even if the customer abandons checkout. Delivery fee is snapshot
  // at order time so future pricing changes never alter historical orders.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: customer.fullName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      delivery_state: delivery.state,
      delivery_city: delivery.city,
      delivery_address: delivery.address,
      delivery_zone_id: delivery.zoneId ?? null,
      delivery_fee: delivery.fee,
      subtotal,
      total: finalTotal,
      payment_status: "pending",
      order_status: "order_received",
      payment_provider: process.env.PAYMENT_PROVIDER ?? "paystack",
      referred_by_vendor_id: referredByVendorId,
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      customer_id: loggedInUserId,
      new_user_discount_applied: newUserDiscountApplied,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Failed to create order:", orderError);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  if (promoCodeId) {
    const { data: current } = await supabase
      .from("promo_codes")
      .select("times_used")
      .eq("id", promoCodeId)
      .single();
    await supabase
      .from("promo_codes")
      .update({ times_used: (current?.times_used ?? 0) + 1 })
      .eq("id", promoCodeId);

    // Locks this customer out of reusing this specific code again,
    // independent of the code's own global usage_limit.
    await supabase.from("promo_code_redemptions").insert({
      promo_code_id: promoCodeId,
      customer_email: customer.email.trim().toLowerCase(),
      order_id: order.id,
    });
  }

  const orderItemsPayload = items.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    variant_id: i.variantId ?? null,
    quantity: i.quantity,
    unit_price: i.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) {
    console.error("Failed to create order items:", itemsError);
    return NextResponse.json(
      { error: "Could not save order items" },
      { status: 500 }
    );
  }

  try {
    const provider = getPaymentProvider();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const payment = await provider.initializePayment({
      email: customer.email,
      amountNaira: finalTotal,
      reference: orderNumber,
      callbackUrl: `${siteUrl}/order-confirmation?order=${orderNumber}`,
      metadata: { orderId: order.id, orderNumber },
    });

    return NextResponse.json({
      orderNumber,
      authorizationUrl: payment.authorizationUrl,
    });
  } catch (err) {
    console.error("Payment initialization failed:", err);
    // The order exists but payment could not start — surface this clearly
    // rather than silently failing, so the order isn't left in limbo.
    return NextResponse.json(
      {
        error:
          "Order was created but payment could not be started. Please try again or contact support.",
        orderNumber,
      },
      { status: 502 }
    );
  }
}
