import Link from "next/link";
import type { FilterOptions, ListFilters } from "@/lib/types";
import { CloseIcon } from "./icons";
import { focusRing } from "./ui";
import { listHref } from "./listing-url";

/** Removable chips for each active filter. Each one links to the same list without that filter. */
export function FilterChips({ filters, options }: { filters: ListFilters; options: FilterOptions }) {
  const chips: { key: keyof ListFilters; label: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}` });
  if (filters.state) chips.push({ key: "state", label: `Destination: ${filters.state}` });
  if (filters.duration) chips.push({ key: "duration", label: `Duration: ${options.durations.find((d) => d.key === filters.duration)?.label ?? filters.duration}` });
  if (filters.budget) chips.push({ key: "budget", label: `Budget: ${options.budgets.find((b) => b.key === filters.budget)?.label ?? filters.budget}` });
  if (filters.month) chips.push({ key: "month", label: `Month: ${options.months.find((m) => m.value === filters.month)?.label ?? filters.month}` });
  if (filters.departureCity) chips.push({ key: "departureCity", label: `From: ${filters.departureCity}` });
  if (filters.tag) chips.push({ key: "tag", label: `Type: ${filters.tag}` });
  if (chips.length === 0) return null;
  return (
    <ul aria-label="Active filters" className="mt-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <li key={c.key}>
          <Link
            href={listHref(filters, { [c.key]: undefined, page: undefined })}
            aria-label={`Remove filter ${c.label}`}
            data-testid="filter-chip"
            className={`inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 text-sm font-medium text-accent hover:bg-white ${focusRing}`}
          >
            {c.label}
            <CloseIcon className="h-3.5 w-3.5" />
          </Link>
        </li>
      ))}
      <li>
        <Link href={listHref({ sort: filters.sort })} className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-ink-700 underline ${focusRing}`}>Clear all</Link>
      </li>
    </ul>
  );
}
