import crypto from "crypto";
import type {
  PaymentProvider,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  WebhookVerificationResult,
  DedicatedAccountInput,
  DedicatedAccountResult,
} from "./types";

const BASE_URL = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystackFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(json.message ?? `Paystack request to ${path} failed`);
  }
  return json;
}

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initializePayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResult> {
    const json = await paystackFetch("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amountNaira * 100), // Paystack expects kobo
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
    });

    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      reference: json.data.reference,
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const json = await paystackFetch(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
    const data = json.data;

    return {
      reference: data.reference,
      status:
        data.status === "success"
          ? "success"
          : data.status === "abandoned" || data.status === "failed"
            ? "failed"
            : "pending",
      amountNaira: data.amount / 100,
      paidAt: data.paid_at ?? undefined,
      raw: data,
    };
  },

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null
  ): WebhookVerificationResult {
    if (!signatureHeader) return { valid: false };

    const hash = crypto
      .createHmac("sha512", secretKey())
      .update(rawBody)
      .digest("hex");

    // Constant-time comparison to avoid timing attacks.
    const valid =
      hash.length === signatureHeader.length &&
      crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signatureHeader));

    if (!valid) return { valid: false };

    const parsed = JSON.parse(rawBody);
    return { valid: true, event: parsed.event, data: parsed.data };
  },

  async createVendorCollectionAccount(
    input: DedicatedAccountInput
  ): Promise<DedicatedAccountResult> {
    // Paystack Dedicated Virtual Accounts requires a Customer to exist first,
    // and requires the business to be approved for DVAs on a supported bank
    // (Nigeria only, business must complete additional KYC with Paystack).
    // See: https://paystack.com/docs/payments/dedicated-virtual-accounts/
    const customer = await paystackFetch("/customer", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
      }),
    });

    const dva = await paystackFetch("/dedicated_account", {
      method: "POST",
      body: JSON.stringify({
        customer: customer.data.customer_code,
        preferred_bank: "wema-bank",
      }),
    });

    return {
      providerAccountReference: String(dva.data.id),
      bankName: dva.data.bank.name,
      accountNumber: dva.data.account_number,
      accountName: dva.data.account_name,
    };
  },
};
