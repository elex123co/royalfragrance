import { createHmac } from "crypto";
import type {
  PaymentProvider,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  WebhookVerificationResult,
  DedicatedAccountInput,
  DedicatedAccountResult,
} from "./types";

// Monnify has two completely separate environments with different base
// URLs — sandbox keys will simply fail against the live URL and vice
// versa. Defaults to sandbox (the safer default — accidentally testing
// against sandbox is harmless, accidentally hitting live with test data
// is not) until MONNIFY_ENV=LIVE is explicitly set.
const BASE_URL =
  process.env.MONNIFY_ENV === "LIVE"
    ? "https://api.monnify.com"
    : "https://sandbox.monnify.com";

// TEMPORARY diagnostic — same bracket trick as before, to rule out
// invisible whitespace or a case mismatch in the env value. Remove once
// the sandbox/live mismatch is confirmed and fixed.
console.log(
  `[MONNIFY_ENV diagnostic] raw env value = [${process.env.MONNIFY_ENV}], using BASE_URL = ${BASE_URL}`
);

function getCredentials() {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  if (!apiKey || !secretKey || !contractCode) {
    throw new Error(
      "MONNIFY_API_KEY, MONNIFY_SECRET_KEY, and MONNIFY_CONTRACT_CODE must all be set."
    );
  }
  return { apiKey, secretKey, contractCode };
}

/**
 * Monnify issues short-lived bearer tokens (unlike Paystack's static secret
 * key), so every provider call fetches a fresh one via Basic auth first —
 * simpler and safer than caching a token across serverless invocations
 * that don't share memory anyway.
 */
async function getAccessToken(): Promise<string> {
  const { apiKey, secretKey } = getCredentials();
  const basic = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Monnify auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const token = data?.responseBody?.accessToken;
  if (!token) throw new Error("Monnify auth response missing accessToken.");
  return token;
}

export const monnifyProvider: PaymentProvider = {
  name: "monnify",

  async initializePayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResult> {
    const { contractCode } = getCredentials();
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountNaira,
        customerName: input.email, // Monnify requires a name; email is the
        // closest thing we reliably have at this call site — the real
        // customer name is already stored on our own order record.
        customerEmail: input.email,
        paymentReference: input.reference,
        paymentDescription: `Royal Fragrance order ${input.reference}`,
        currencyCode: "NGN",
        contractCode,
        redirectUrl: input.callbackUrl,
        metaData: input.metadata ?? {},
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Monnify initialize failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const body = data?.responseBody;
    if (!body?.checkoutUrl) {
      throw new Error("Monnify initialize response missing checkoutUrl.");
    }

    return {
      authorizationUrl: body.checkoutUrl,
      accessCode: body.transactionReference,
      reference: input.reference,
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const token = await getAccessToken();

    // Verifying by OUR OWN paymentReference (the order number we generated
    // and passed at initialize time) — never trust a reference the client
    // sends back without this server-side check.
    const res = await fetch(
      `${BASE_URL}/api/v2/transactions/query?paymentReference=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Monnify verify failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const body = data?.responseBody;
    const paymentStatus = body?.paymentStatus as string | undefined;

    const status: VerifyPaymentResult["status"] =
      paymentStatus === "PAID"
        ? "success"
        : paymentStatus === "PENDING"
          ? "pending"
          : "failed";

    return {
      reference,
      status,
      amountNaira: Number(body?.amountPaid ?? 0),
      paidAt: body?.paidOn,
      raw: data,
    };
  },

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null
  ): WebhookVerificationResult {
    if (!signatureHeader) return { valid: false };

    const { secretKey } = getCredentials();
    const computed = createHmac("sha512", secretKey).update(rawBody).digest("hex");

    if (computed !== signatureHeader) return { valid: false };

    try {
      const parsed = JSON.parse(rawBody);
      return { valid: true, event: parsed?.eventType, data: parsed?.eventData };
    } catch {
      return { valid: false };
    }
  },

  async createVendorCollectionAccount(
    input: DedicatedAccountInput
  ): Promise<DedicatedAccountResult> {
    const { contractCode } = getCredentials();

    if (!input.bvn && !input.nin) {
      throw new Error(
        "Monnify requires a BVN or NIN to create a Reserved Account — this vendor doesn't have one on file yet."
      );
    }

    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/api/v2/bank-transfer/reserved-accounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountReference: `vendor-${input.vendorId}`,
        accountName: `${input.firstName} ${input.lastName}`.trim(),
        currencyCode: "NGN",
        contractCode,
        customerEmail: input.email,
        customerName: `${input.firstName} ${input.lastName}`.trim(),
        bvn: input.bvn,
        nin: input.nin,
        getAllAvailableBanks: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Monnify reserved account creation failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const body = data?.responseBody;
    const account = body?.accounts?.[0];

    if (!account) {
      throw new Error("Monnify reserved account response missing account details.");
    }

    return {
      providerAccountReference: body.accountReference,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: body.accountName,
    };
  },
};
