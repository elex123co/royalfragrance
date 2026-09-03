import type {
  PaymentProvider,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  WebhookVerificationResult,
  DedicatedAccountInput,
  DedicatedAccountResult,
} from "./types";

/**
 * Monnify provider — structural stub.
 *
 * Wired to the same PaymentProvider interface as Paystack so switching
 * PAYMENT_PROVIDER=monnify in .env is the only change the rest of the app
 * needs. Before going live with this provider: implement OAuth2 token
 * fetching (Monnify uses short-lived bearer tokens, unlike Paystack's
 * static secret key), transaction initialization, verification, webhook
 * signature checks (Monnify signs with a SHA512 hash of the transaction
 * reference + secret key), and reserved account creation — all against
 * Monnify's current official API docs.
 */
export const monnifyProvider: PaymentProvider = {
  name: "monnify",

  async initializePayment(
    _input: InitializePaymentInput
  ): Promise<InitializePaymentResult> {
    throw new Error(
      "Monnify provider is not yet implemented. Implement against Monnify's " +
        "current API docs before setting PAYMENT_PROVIDER=monnify."
    );
  },

  async verifyPayment(_reference: string): Promise<VerifyPaymentResult> {
    throw new Error("Monnify provider is not yet implemented.");
  },

  verifyWebhookSignature(
    _rawBody: string,
    _signatureHeader: string | null
  ): WebhookVerificationResult {
    return { valid: false };
  },

  async createVendorCollectionAccount(
    _input: DedicatedAccountInput
  ): Promise<DedicatedAccountResult> {
    throw new Error("Monnify provider is not yet implemented.");
  },
};
