/**
 * Payment provider abstraction.
 *
 * The rest of the app (checkout route, webhook handler, admin settings)
 * talks to this interface only — never to Paystack or Monnify directly.
 * This keeps the application from being permanently coupled to one
 * provider (spec section 28).
 */

export interface InitializePaymentInput {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode?: string;
  reference: string;
}

export interface VerifyPaymentResult {
  reference: string;
  status: "success" | "failed" | "pending";
  amountNaira: number;
  paidAt?: string;
  raw: unknown;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: string;
  data?: unknown;
}

export interface DedicatedAccountInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /** Optional: the underlying customer/vendor id for our own metadata */
  vendorId: string;
}

export interface DedicatedAccountResult {
  providerAccountReference: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentProvider {
  readonly name: "paystack" | "monnify";

  /** Start a customer checkout payment; returns a URL to redirect the customer to. */
  initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;

  /** Server-to-server verification of a transaction reference — never trust the frontend. */
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;

  /** Verify an inbound webhook's signature before treating its payload as valid. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): WebhookVerificationResult;

  /**
   * Create or assign a persistent virtual/reserved account for a vendor,
   * where supported by the provider and the business's approved
   * configuration. Not every provider or account tier supports this —
   * callers must handle a thrown "not supported" error gracefully.
   */
  createVendorCollectionAccount(input: DedicatedAccountInput): Promise<DedicatedAccountResult>;
}
