import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";
import { monnifyProvider } from "./monnify";

export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "paystack";

  switch (configured) {
    case "paystack":
      return paystackProvider;
    case "monnify":
      return monnifyProvider;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${configured}`);
  }
}

export * from "./types";
