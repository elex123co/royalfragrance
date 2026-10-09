import { Clock, MessageCircle } from "lucide-react";
import { LogoutButton } from "@/components/account/LogoutButton";

export function PendingApprovalScreen({
  name,
  status,
  whatsappLink,
}: {
  name: string;
  status: string;
  whatsappLink: string;
}) {
  const suspended = status === "suspended" || status === "inactive";
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md rounded-xl2 border border-espresso/10 bg-white/70 p-8 text-center shadow-premium-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-caramel/15 text-caramel">
          <Clock size={26} />
        </div>
        <h1 className="mt-5 font-display text-2xl text-espresso">
          {suspended ? "Account Not Active" : "Application Under Review"}
        </h1>
        <p className="mt-3 text-sm text-rich/70">
          {suspended
            ? `Hello ${name}, your vendor account is currently not active. Please contact us to find out more.`
            : `Hello ${name}, thank you for applying. Your vendor dashboard will unlock as soon as our team approves your application. We will notify you by email.`}
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-6 py-3 text-sm text-cream hover:bg-rich"
        >
          <MessageCircle size={16} />
          Chat with us on WhatsApp
        </a>
        <div className="mt-5 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
