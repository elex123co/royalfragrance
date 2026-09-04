"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function ShopFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", query);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl2 border border-espresso/10 bg-white/50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rich/40"
        />
        <input
          type="text"
          placeholder="Search fragrances…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-espresso/15 bg-white py-2 pl-9 pr-4 text-sm text-espresso focus:border-caramel focus:outline-none"
        />
      </form>

      <div className="flex flex-wrap gap-3">
        <select
          defaultValue={searchParams.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-full border border-espresso/15 bg-white px-4 py-2 text-sm text-espresso focus:border-caramel focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("sort") ?? ""}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-full border border-espresso/15 bg-white px-4 py-2 text-sm text-espresso focus:border-caramel focus:outline-none"
        >
          <option value="">Sort: Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>
    </div>
  );
}
