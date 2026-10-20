import { SORTS } from "@/lib/config";
import type { ListFilters } from "@/lib/types";

export const FILTER_KEYS = ["state", "duration", "budget", "month", "departureCity", "tag"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Reads the listing URL into the filters the data layer takes. Everything lives in the URL. */
export function parseFilters(sp: RawParams): ListFilters {
  const sort = first(sp.sort);
  const page = Number(first(sp.page));
  return {
    q: first(sp.q)?.slice(0, 100),
    state: first(sp.state),
    duration: first(sp.duration),
    budget: first(sp.budget),
    month: first(sp.month),
    departureCity: first(sp.departureCity),
    tag: first(sp.tag),
    sort: SORTS.some((s) => s.key === sort) ? sort : undefined,
    page: Number.isInteger(page) && page > 0 ? page : undefined,
  };
}

/** /holidays URL for a set of filters, with optional overrides (undefined removes a key). */
export function listHref(filters: ListFilters, override: Partial<Record<keyof ListFilters, string | number | undefined>> = {}): string {
  const merged: Record<string, string | number | undefined> = { ...filters, ...override };
  const qs = new URLSearchParams();
  for (const key of ["q", ...FILTER_KEYS, "sort", "page"]) {
    const v = merged[key];
    if (v !== undefined && v !== "" && !(key === "page" && Number(v) <= 1)) qs.set(key, String(v));
  }
  const s = qs.toString();
  return s ? `/holidays?${s}` : "/holidays";
}
