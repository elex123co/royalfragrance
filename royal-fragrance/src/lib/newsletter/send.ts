import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "Elizabeth at Royal Fragrance <onboarding@resend.dev>";

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
      ? `<div style="margin-top:24px; padding:20px; background:#F8F2EB; border-radius:16px;">
           <p style="font-weight:600; margin:0 0 12px;">${params.interactiveQuestion ?? "What happens next?"}</p>
           ${params.interactiveChoices
             .map(
               (c) => `<a href="${siteUrl}/api/newsletter/vote?newsletter=${params.newsletterId}&choice=${encodeURIComponent(c.key)}&email=${encodeURIComponent(params.voterEmail)}"
                 style="display:inline-block; margin:4px 8px 4px 0; padding:10px 18px; background:#1E120C; color:#E8D7C5; text-decoration:none; border-radius:999px; font-size:14px;">
                 ${c.key} — ${c.label}
               </a>`
             )
             .join("")}
         </div>`
      : "";

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1E120C; background: #E8D7C5;">
      <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #A66A43; margin: 0 0 16px;">
        Royal Fragrance
      </p>
      ${params.content}
      ${choicesHtml}
      <p style="margin-top: 32px; font-size: 13px; color: #70452F;">
        Until next time,<br/>Elizabeth 👑
      </p>
      <p style="margin-top: 24px; font-size: 11px; color: #A66A43;">
        <a href="${siteUrl}/newsletter/${params.newsletterId}" style="color:#A66A43;">Read online</a>
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
