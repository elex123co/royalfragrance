import { Check } from "lucide-react";

const STEPS = [
  { key: "order_received", label: "Placed" },
  { key: "payment_confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTimeline({ status }: { status: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                i < activeIndex
                  ? "bg-caramel text-espresso"
                  : i === activeIndex
                    ? "bg-espresso text-cream"
                    : "bg-espresso/10 text-espresso/40"
              }`}
            >
              {i < activeIndex ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`mt-1.5 whitespace-nowrap text-[10px] ${
                i <= activeIndex ? "text-espresso" : "text-espresso/40"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1 h-px flex-1 ${
                i < activeIndex ? "bg-caramel" : "bg-espresso/15"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
