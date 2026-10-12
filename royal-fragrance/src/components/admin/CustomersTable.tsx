"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { deleteCustomers } from "@/lib/actions/admin-customers";

export interface CustomerRow {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  joined: string;
  orders: number;
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function runDelete(ids: string[]) {
    if (ids.length === 0) return;
    const withOrders = customers.filter((c) => ids.includes(c.id) && c.orders > 0).length;
    const warning =
      withOrders > 0
        ? `\n\n${withOrders} of them have placed orders. Their orders are kept for your records, but the accounts and logins are removed.`
        : "";
    if (
      !confirm(
        `Permanently delete ${ids.length} customer account${ids.length === 1 ? "" : "s"}? This cannot be undone.${warning}`
      )
    )
      return;

    setMessage(null);
    startTransition(async () => {
      const result = await deleteCustomers(ids);
      if (result.deleted > 0) {
        setMessage({
          ok: !result.error,
          text: `Deleted ${result.deleted} account${result.deleted === 1 ? "" : "s"}.${result.error ? " " + result.error : ""}`,
        });
        setSelected(new Set());
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error ?? "Nothing was deleted." });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rich/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone"
            className="w-full rounded-full border border-espresso/15 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => runDelete(Array.from(selected))}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={15} />
            {pending ? "Deleting…" : `Delete selected (${selected.size})`}
          </button>
        )}
      </div>

      {message && (
        <p
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all shown"
                />
              </th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">First Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-rich/50">
                  No customers found.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-espresso/5 last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select ${c.email}`}
                  />
                </td>
                <td className="px-4 py-3 text-espresso">{c.fullName || "—"}</td>
                <td className="px-4 py-3">{c.firstName || "—"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="break-all px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3 text-rich/60">
                  {new Date(c.joined).toLocaleDateString("en-NG")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => runDelete([c.id])}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
