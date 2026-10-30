"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/utils/currency";
import { Button } from "@/components/ui/Button";
import type { DeliveryZone } from "@/lib/data/delivery";
import { PICKUP_FEE, PICKUP_LOCATION } from "@/lib/pickup";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";

type Step = "customer" | "delivery" | "summary";

export interface CheckoutBatch {
  id: string;
  label: string | null;
  locationName: string;
  state: string;
  share: number;
  closesAt: string;
  spotsLeft: number;
}

export function CheckoutForm({
  zones,
  batches = [],
  newUserDiscountEligible = false,
  newUserDiscountPercentage = 10,
}: {
  zones: DeliveryZone[];
  batches?: CheckoutBatch[];
  newUserDiscountEligible?: boolean;
  newUserDiscountPercentage?: number;
}) {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>("customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackMetaEvent("InitiateCheckout", {
      content_ids: items.map((i) => i.productId),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value: subtotal,
      currency: "NGN",
    });
    // Fire once when checkout is entered, not on every re-render as items change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [delivery, setDelivery] = useState({
    city: "",
    address: "",
    zoneId: zones[0]?.id ?? "",
  });
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<
    { applied: false } | { applied: true; code: string; discountAmount: number } | { applied: false; error: string }
  >({ applied: false });
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [batchId, setBatchId] = useState<string>("");
  const selectedBatch = batches.find((b) => b.id === batchId);

  const selectedZone = zones.find((z) => z.id === delivery.zoneId);
  const [wantsPickup, setWantsPickup] = useState(false);
  const pickupAvailable = !selectedBatch && selectedZone?.state === "Lagos";
  const isPickup = wantsPickup && pickupAvailable;
  const deliveryFee = selectedBatch
    ? selectedBatch.share
    : isPickup
      ? PICKUP_FEE
      : selectedZone?.fee ?? 0;

  // A promo code, once applied, REPLACES the automatic new-customer
  // discount rather than stacking with it — matching exactly how the
  // backend computes the real charge at order-creation time, so what's
  // shown here is never misleading.
  const autoDiscountAmount =
    !promoStatus.applied && newUserDiscountEligible
      ? Math.round(subtotal * (newUserDiscountPercentage / 100))
      : 0;
  const discountAmount = promoStatus.applied ? promoStatus.discountAmount : autoDiscountAmount;
  const discountLabel = promoStatus.applied
    ? `Promo code "${promoStatus.code}"`
    : "New customer discount";
  const total = subtotal + deliveryFee - discountAmount;

  async function handleApplyPromo() {
    setApplyingPromo(true);
    const { applyPromoCode } = await import("@/lib/actions/promo");
    const result = await applyPromoCode(
      promoInput,
      items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
      customer.email
    );
    setApplyingPromo(false);

    if (!result.valid) {
      setPromoStatus({ applied: false, error: result.error ?? "Invalid code." });
      return;
    }
    setPromoStatus({
      applied: true,
      code: promoInput.toUpperCase(),
      discountAmount: result.discountAmount ?? 0,
    });
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          delivery: {
            state: selectedBatch ? selectedBatch.state : selectedZone?.state ?? selectedZone?.name ?? "",
            city: selectedBatch ? selectedBatch.locationName : isPickup ? "Ipaja" : delivery.city,
            address: selectedBatch
              ? `Batch delivery: ${selectedBatch.locationName}`
              : isPickup
                ? `Pickup at ${PICKUP_LOCATION}`
                : delivery.address,
            method: isPickup ? "pickup" : "delivery",
            zoneId: selectedBatch ? undefined : delivery.zoneId,
            fee: deliveryFee,
          },
          batchId: selectedBatch ? selectedBatch.id : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          promoCode: promoStatus.applied ? promoStatus.code : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      clearCart();
      window.location.href = json.authorizationUrl;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-rich/70">
        Your cart is empty. Add a fragrance before checking out.
      </p>
    );
  }

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm sm:p-8">
      <StepIndicator step={step} />

      {newUserDiscountEligible && !promoStatus.applied && (
        <div className="mt-6 rounded-xl bg-caramel/15 px-4 py-3 text-sm text-espresso">
          You qualify for <strong>{newUserDiscountPercentage}% off</strong> as a new
          customer — already applied to your total below.
        </div>
      )}

      {step === "customer" && (
        <div className="mt-8 space-y-4">
          <Field
            label="Full Name"
            value={customer.fullName}
            onChange={(v) => setCustomer((c) => ({ ...c, fullName: v }))}
          />
          <Field
            label="Email"
            type="email"
            value={customer.email}
            onChange={(v) => setCustomer((c) => ({ ...c, email: v }))}
          />
          <Field
            label="Phone Number"
            value={customer.phone}
            onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))}
          />
          <Button
            className="mt-4 w-full"
            disabled={!customer.fullName || !customer.email || !customer.phone}
            onClick={() => setStep("delivery")}
          >
            Continue to Delivery
          </Button>
        </div>
      )}

      {step === "delivery" && (
        <div className="mt-8 space-y-4">
          {batches.length > 0 && (
            <div className="rounded-xl border border-caramel/30 bg-caramel/10 p-4">
              <p className="text-sm font-medium text-espresso">Share delivery with a batch</p>
              <p className="mt-1 text-xs text-rich/70">
                Customers in the same location split one delivery fee. If the batch takes too long, you can switch to
                individual delivery from your order page.
              </p>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-3 w-full rounded-lg border border-espresso/15 bg-white px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
              >
                <option value="">No batch: normal delivery</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.locationName}
                    {b.label ? ` (${b.label})` : ""} — {formatNaira(b.share)} delivery, closes{" "}
                    {new Date(b.closesAt).toLocaleDateString()}, {b.spotsLeft} order{b.spotsLeft === 1 ? "" : "s"} left
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={selectedBatch ? "hidden" : ""}>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              State
            </label>
            <select
              value={delivery.zoneId}
              onChange={(e) =>
                setDelivery((d) => ({ ...d, zoneId: e.target.value }))
              }
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {formatNaira(z.fee)} delivery
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-rich/60">
              {selectedZone?.state === "Lagos"
                ? "Estimated delivery: 24–48 hours within Lagos."
                : "Estimated delivery: 1–4 weeks outside Lagos — we aim to get it to you sooner, but it will never take longer than 4 weeks."}
            </p>
          </div>
          {pickupAvailable && (
            <div className="rounded-xl border border-espresso/10 bg-white p-4">
              <p className="mb-2 text-sm font-medium text-espresso">How would you like to receive your order?</p>
              <label className="flex cursor-pointer items-start gap-2 py-1 text-sm text-rich/80">
                <input type="radio" name="method" checked={!isPickup} onChange={() => setWantsPickup(false)} className="mt-1" />
                <span>Deliver to my address ({formatNaira(selectedZone?.fee ?? 0)})</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 py-1 text-sm text-rich/80">
                <input type="radio" name="method" checked={isPickup} onChange={() => setWantsPickup(true)} className="mt-1" />
                <span>
                  Pick up at {PICKUP_LOCATION} ({formatNaira(PICKUP_FEE)})
                  <span className="block text-xs text-rich/60">Available for Lagos only. Come to Ipaja to collect your order.</span>
                </span>
              </label>
            </div>
          )}
          {isPickup ? (
            <p className="rounded-lg bg-espresso/5 px-4 py-3 text-sm text-rich/80">
              Pickup location: <strong>{PICKUP_LOCATION}</strong>. We will let you know when your order is ready to collect.
            </p>
          ) : selectedBatch ? (
            <p className="rounded-lg bg-espresso/5 px-4 py-3 text-sm text-rich/80">
              Delivery location: <strong>{selectedBatch.locationName}</strong>. Your order will be delivered with this
              batch.
            </p>
          ) : (
            <>
              <Field
                label="City / Area"
                value={delivery.city}
                onChange={(v) => setDelivery((d) => ({ ...d, city: v }))}
              />
              <Field
                label="Full Delivery Address"
                value={delivery.address}
                onChange={(v) => setDelivery((d) => ({ ...d, address: v }))}
              />
            </>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="border-espresso/20 text-espresso" onClick={() => setStep("customer")}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedBatch && !isPickup && (!delivery.zoneId || !delivery.city || !delivery.address)}
              onClick={() => setStep("summary")}
            >
              Review Order
            </Button>
          </div>
        </div>
      )}

      {step === "summary" && (
        <div className="mt-8">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="flex justify-between text-sm text-rich/80"
              >
                <span>
                  {item.name} {item.size ? `(${item.size})` : ""} × {item.quantity}
                </span>
                <span>{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                disabled={promoStatus.applied}
                className="flex-1 rounded-lg border border-espresso/15 px-4 py-2 text-sm uppercase focus:border-caramel focus:outline-none disabled:bg-espresso/5"
              />
              {promoStatus.applied ? (
                <button
                  type="button"
                  onClick={() => {
                    setPromoStatus({ applied: false });
                    setPromoInput("");
                  }}
                  className="rounded-lg border border-espresso/20 px-4 text-sm text-espresso hover:bg-espresso/5"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={applyingPromo || !promoInput.trim()}
                  className="rounded-lg bg-espresso px-4 text-sm text-cream hover:bg-rich disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {applyingPromo ? "Checking…" : "Apply"}
                </button>
              )}
            </div>
            {promoStatus.applied && (
              <p className="mt-1.5 text-xs text-green-700">
                "{promoStatus.code}" applied — {formatNaira(promoStatus.discountAmount)} off
                {newUserDiscountEligible
                  ? " (replaces your automatic new-customer discount)"
                  : ""}
              </p>
            )}
            {!promoStatus.applied && "error" in promoStatus && promoStatus.error && (
              <p className="mt-1.5 text-xs text-red-600">{promoStatus.error}</p>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-espresso/10 pt-4 text-sm">
            <div className="flex justify-between text-rich/80">
              <span>Product Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-rich/80">
              <span>
                {selectedBatch
                  ? `Batch delivery share (${selectedBatch.locationName})`
                  : isPickup
                    ? `Pickup (${PICKUP_LOCATION})`
                    : `Delivery Fee (${selectedZone?.name})`}
              </span>
              <span>{formatNaira(deliveryFee)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{discountLabel}</span>
                <span>−{formatNaira(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-espresso/10 pt-2 font-display text-lg text-espresso">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="border-espresso/20 text-espresso" onClick={() => setStep("delivery")}>
              Back
            </Button>
            <Button className="flex-1" onClick={handlePay} disabled={submitting}>
              {submitting ? "Redirecting to payment…" : `Pay ${formatNaira(total)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "customer", label: "Your Info" },
    { key: "delivery", label: "Delivery" },
    { key: "summary", label: "Payment" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              i <= activeIndex
                ? "bg-espresso text-cream"
                : "bg-espresso/10 text-espresso/50"
            }`}
          >
            {i + 1}
          </span>
          <span
            className={i <= activeIndex ? "text-espresso" : "text-espresso/40"}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="mx-1 h-px w-6 bg-espresso/15" />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-espresso">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
      />
    </div>
  );
}
