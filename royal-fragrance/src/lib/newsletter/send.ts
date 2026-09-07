import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "Elizabeth <onboarding@resend.dev>";

/**
 * Deliberately styled like a personal letter, not a marketing template —
 * Gmail's Promotions-tab classifier weighs heavily-styled CTA buttons,
 * a loud branded header, and "ad-like" visual structure. Plain paragraphs
 * and text links read as a real message, which also just fits Elizabeth's
 * actual voice better than a corporate newsletter shell would.
 */
function renderEmailHtml(params: {
  content: string;
  newsletterId: string;
  isInteractive: boolean;
  interactiveQuestion?: string;
  interactiveChoices?: { key: string; label: string }[];
  voterEmail: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://royalfragrance.netlify.app";

  const choicesHtml =
    params.isInteractive && params.interactiveChoices
      ? `<p style="margin-top:20px;">${params.interactiveQuestion ?? "What happens next?"}</p>
         <p style="margin-top:8px;">
           ${params.interactiveChoices
             .map(
               (c) =>
                 `<a href="${siteUrl}/api/newsletter/vote?newsletter=${params.newsletterId}&choice=${encodeURIComponent(c.key)}&email=${encodeURIComponent(params.voterEmail)}"
                   style="color:#4A2C20; text-decoration:underline;">${c.key} — ${c.label}</a>`
             )
             .join("<br/>")}
         </p>`
      : "";

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 28px 20px; color: #1E120C; font-size: 16px; line-height: 1.6;">
      ${params.content}
      ${choicesHtml}
      <p style="margin-top: 28px;">
        Until next time,<br/>Elizabeth
      </p>
      <p style="margin-top: 20px; font-size: 13px; color: #70452F;">
        <a href="${siteUrl}/newsletter/${params.newsletterId}" style="color:#70452F;">Read this online</a> —
        and if you'd like these in your main inbox rather than Promotions, dragging this
        email into Primary (or replying once) tends to teach Gmail to keep it there.
      </p>
    </div>
  `;
}

export async function sendNewsletterToSubscribers(
  supabase: SupabaseClient,
  newsletter: {
    id: string;
    subject: string;
    content: string;
    is_interactive: boolean;
    interactive_question: string | null;
    interactive_choices: { key: string; label: string }[] | null;
  }
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const resend = new Resend(apiKey);

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("email");

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers ?? []) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: sub.email,
        subject: newsletter.subject,
        html: renderEmailHtml({
          content: newsletter.content,
          newsletterId: newsletter.id,
          isInteractive: newsletter.is_interactive,
          interactiveQuestion: newsletter.interactive_question ?? undefined,
          interactiveChoices: newsletter.interactive_choices ?? undefined,
          voterEmail: sub.email,
        }),
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send newsletter to ${sub.email}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
