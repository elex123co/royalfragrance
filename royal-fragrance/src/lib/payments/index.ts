import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";
import { monnifyProvider } from "./monnify";

export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "paystack";

  // TEMPORARY diagnostic — wrapped in quotes/brackets specifically to
  // reveal invisible whitespace or an empty string, which "monnify" vs
  // " monnify" would otherwise look identical in a log. Remove once the
  // provider-selection mismatch is confirmed and fixed.
  console.log(`[PAYMENT_PROVIDER diagnostic] raw env value = [${process.env.PAYMENT_PROVIDER}]`);

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
