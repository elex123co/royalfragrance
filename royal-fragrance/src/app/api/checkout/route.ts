import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";

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
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
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

  const { customer, delivery, items } = parsed.data;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + delivery.fee;
  const orderNumber = generateOrderNumber();

  const supabase = createAdminClient();

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
      total,
      payment_status: "pending",
      order_status: "order_received",
      payment_provider: process.env.PAYMENT_PROVIDER ?? "paystack",
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Failed to create order:", orderError);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
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
      amountNaira: total,
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
