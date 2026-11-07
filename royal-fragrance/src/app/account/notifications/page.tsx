import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data/account";
import { MarkAllReadButton } from "@/components/account/MarkAllReadButton";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.account.notifications.title", "Notifications — Royal Fragrance") 
  };
}

export default async function NotificationsPage() { const _t = await getT();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const notifications = await getNotifications(user!.id);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-espresso">{_t("account.notifications.753a22", "Notifications")}</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-rich/50">{_t("account.notifications.82e599", "Nothing yet — check back soon.")}</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <div
                className={`rounded-xl2 border p-4 text-sm transition ${
                  n.read
                    ? "border-espresso/10 bg-white/40 text-rich/70"
                    : "border-caramel/30 bg-caramel/5 text-espresso"
                }`}
              >
                <p>{n.message}</p>
                <p className="mt-1 text-xs text-rich/40">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
