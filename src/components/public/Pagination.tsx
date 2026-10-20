import Link from "next/link";
import type { ListFilters } from "@/lib/types";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { focusRing } from "./ui";
import { listHref } from "./listing-url";

function pageWindow(page: number, count: number): (number | "gap")[] {
  const set = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) { set.add(2); set.add(3); }
  if (page >= count - 2) { set.add(count - 1); set.add(count - 2); }
  const pages = [...set].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, filters }: { page: number; pageCount: number; filters: ListFilters }) {
  if (pageCount <= 1) return null;
  const box = `flex h-9 min-w-9 items-center justify-center rounded border px-2 text-sm font-medium ${focusRing}`;
  return (
    <nav aria-label="Pagination" className="mt-8">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={listHref(filters, { page: page - 1 })} aria-label="Previous page" rel="prev" className={`${box} border-ink-200 bg-white hover:bg-ink-100`}><ChevronLeftIcon className="h-4 w-4" /></Link>
          ) : (
            <span aria-hidden="true" className={`${box} border-transparent bg-ink-100 text-ink-500`}><ChevronLeftIcon className="h-4 w-4" /></span>
          )}
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`g${i}`} aria-hidden="true" className="px-1 text-ink-500">…</li>
          ) : (
            <li key={p}>
              <Link
                href={listHref(filters, { page: p })}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`${box} ${p === page ? "border-accent bg-white text-accent" : "border-ink-200 bg-white hover:bg-ink-100"}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={listHref(filters, { page: page + 1 })} aria-label="Next page" rel="next" className={`${box} border-ink-200 bg-white hover:bg-ink-100`}><ChevronRightIcon className="h-4 w-4" /></Link>
          ) : (
            <span aria-hidden="true" className={`${box} border-transparent bg-ink-100 text-ink-500`}><ChevronRightIcon className="h-4 w-4" /></span>
          )}
        </li>
      </ul>
    </nav>
  );
}
