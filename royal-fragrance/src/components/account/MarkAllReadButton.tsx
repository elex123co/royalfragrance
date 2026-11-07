"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "@/lib/actions/customer";
import { useT } from "@/lib/content/client";

export function MarkAllReadButton() { const _t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          router.refresh();
        })
      }
      className="text-xs text-caramel underline"
    >{_t("account.markallreadbutton.1b8316", "Mark all as read")}</button>
  );
}
