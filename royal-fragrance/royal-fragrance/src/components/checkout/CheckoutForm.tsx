"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/utils/currency";
import { Button } from "@/components/ui/Button";
import type { DeliveryZone } from "@/lib/data/delivery";

type Step = "customer" | "delivery" | "summary";

export function CheckoutForm({ zones }: { zones: DeliveryZone[] }) {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>("customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [delivery, setDelivery] = useState({
    state: "",
    city: "",
    address: "",
    zoneId: zones[0]?.id ?? "",
  });

  const selectedZone = zones.find((z) => z.id === delivery.zoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          delivery: { ...delivery, fee: deliveryFee },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
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
          <Field
            label="State"
            value={delivery.state}
            onChange={(v) => setDelivery((d) => ({ ...d, state: v }))}
          />
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Delivery Zone
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
                  {z.name} — {formatNaira(z.fee)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="border-espresso/20 text-espresso" onClick={() => setStep("customer")}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!delivery.state || !delivery.city || !delivery.address}
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

          <div className="mt-4 space-y-2 border-t border-espresso/10 pt-4 text-sm">
            <div className="flex justify-between text-rich/80">
              <span>Product Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-rich/80">
              <span>Delivery Fee ({selectedZone?.name})</span>
              <span>{formatNaira(deliveryFee)}</span>
            </div>
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
