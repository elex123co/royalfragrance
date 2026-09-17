"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefForPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/shop?${params.toString()}`;
  }

  // Show a reasonable window of page numbers rather than every page when
  // there are many — first, last, current, and a couple neighbors.
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={hrefForPage(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-espresso/15 text-espresso transition hover:bg-espresso/5 ${
          currentPage === 1 ? "pointer-events-none opacity-30" : ""
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {sortedPages.map((page, i) => {
        const prevPage = sortedPages[i - 1];
        const showEllipsis = prevPage !== undefined && page - prevPage > 1;
        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis && <span className="text-rich/40">…</span>}
            <Link
              href={hrefForPage(page)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                page === currentPage
                  ? "bg-espresso text-cream"
                  : "border border-espresso/15 text-espresso hover:bg-espresso/5"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      <Link
        href={hrefForPage(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-espresso/15 text-espresso transition hover:bg-espresso/5 ${
          currentPage === totalPages ? "pointer-events-none opacity-30" : ""
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
