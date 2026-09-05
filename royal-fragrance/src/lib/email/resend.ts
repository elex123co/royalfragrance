import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Royal Fragrance <onboarding@resend.dev>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Sends an email via Resend. Never throws — a failed or unconfigured
 * email send should never block the underlying action (vendor signup,
 * approval, etc.) from completing. Logs the failure instead.
 *
 * NOTE: Until a custom domain is verified in Resend, the default
 * `onboarding@resend.dev` sender can only deliver to the email address
 * that owns the Resend account (sandbox restriction) — real vendor/
 * customer emails to other addresses won't arrive until a domain is
 * verified and RESEND_FROM_EMAIL is set to an address on it.
 */
async function sendEmail(params: { to: string; subject: string; html: string }) {
  const client = getClient();
  if (!client) {
    console.warn("RESEND_API_KEY not set — skipping email:", params.subject);
    return;
  }

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error("Failed to send email via Resend:", err);
  }
}

const wrapper = (title: string, body: string) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1E120C;">
    <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #A66A43; margin: 0 0 8px;">
      Royal Fragrance
    </p>
    <h1 style="font-size: 22px; margin: 0 0 20px;">${title}</h1>
    ${body}
    <p style="margin-top: 32px; font-size: 12px; color: #70452F;">
      Royal Fragrance — More than a fragrance.
    </p>
  </div>
`;

export async function sendVendorApplicationReceivedEmail(to: string, name: string) {
  await sendEmail({
    to,
    subject: "We've received your Royal Fragrance vendor application",
    html: wrapper(
      "Application Received",
      `<p>Hi ${name},</p>
       <p>Thanks for applying to become a Royal Fragrance vendor. Our team is reviewing your application now — we'll email you as soon as a decision is made.</p>
       <p>In the meantime, you can already sign in to see your vendor dashboard, though selling and collection features unlock once you're approved.</p>`
    ),
  });
}

export async function sendVendorApprovedEmail(to: string, name: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://royalfragrance.netlify.app";
  await sendEmail({
    to,
    subject: "You're approved as a Royal Fragrance vendor 🎉",
    html: wrapper(
      "You're Approved",
      `<p>Hi ${name},</p>
       <p>Great news — your vendor account is now active. You can log in and start recording sales, checking your collection account, and managing inventory right away.</p>
       <p><a href="${siteUrl}/login" style="display:inline-block; margin-top:12px; padding:10px 20px; background:#1E120C; color:#E8D7C5; text-decoration:none; border-radius:999px;">Sign In</a></p>`
    ),
  });
}
