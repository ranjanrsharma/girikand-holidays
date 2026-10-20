"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FilterOptions } from "@/lib/types";
import { CloseIcon, FilterIcon } from "./icons";
import { btnOutline, btnPrimary, focusRing } from "./ui";
import { FILTER_KEYS, listHref, type FilterKey } from "./listing-url";

type Selected = Partial<Record<FilterKey, string>>;

interface Group { key: FilterKey; legend: string; options: { value: string; label: string; count: number }[] }

function groupsFrom(o: FilterOptions): Group[] {
  return [
    { key: "state", legend: "Destination", options: o.states.map((s) => ({ value: s.value, label: s.value, count: s.count })) },
    { key: "duration", legend: "Duration", options: o.durations.map((d) => ({ value: d.key, label: d.label, count: d.count })) },
    { key: "budget", legend: "Budget (per person)", options: o.budgets.map((b) => ({ value: b.key, label: b.label, count: b.count })) },
    { key: "month", legend: "Month of travel", options: o.months.map((m) => ({ value: m.value, label: m.label, count: m.count })) },
    { key: "departureCity", legend: "Departure city", options: o.departureCities.map((c) => ({ value: c.value, label: c.value, count: c.count })) },
    { key: "tag", legend: "Holiday type", options: o.tags.map((t) => ({ value: t.value, label: t.value, count: t.count })) },
  ];
}

/** "Filter your Tour" button and its drawer. Apply writes the choices into the URL. */
export function FilterDrawer({ options, selected, q, sort }: { options: FilterOptions; selected: Selected; q?: string; sort?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Selected>(selected);
  const activeCount = FILTER_KEYS.filter((k) => selected[k]).length;

  const open = () => {
    setDraft(selected);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();
  const go = (s: Selected) => {
    router.push(listHref({ q, sort, ...s }));
    close();
  };

  return (
    <>
      <button type="button" onClick={open} className={`${btnOutline} w-full justify-start sm:w-auto sm:min-w-56`}>
        <FilterIcon className="h-5 w-5" />
        Filter your Tour
        {activeCount > 0 && <span className="ml-auto rounded-full bg-accent px-2 text-xs font-semibold text-white" aria-label={`${activeCount} filters active`}>{activeCount}</span>}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="filter-title"
        onClick={(e) => { if (e.target === ref.current) close(); }}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-hidden bg-white p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/60"
      >
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            go(draft);
          }}
        >
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
            <h2 id="filter-title" className="text-xl font-semibold">Filter your Tour</h2>
            <button type="button" onClick={close} aria-label="Close filters" className={`rounded-full p-1.5 hover:bg-ink-100 ${focusRing}`}><CloseIcon /></button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            {groupsFrom(options).map((g) => (
              <fieldset key={g.key}>
                <legend className="mb-2 font-semibold">{g.legend}</legend>
                {g.options.length === 0 ? (
                  <p className="text-sm text-ink-500">No options yet.</p>
                ) : (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    <li>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-ink-50">
                        <input type="radio" name={g.key} value="" checked={!draft[g.key]} onChange={() => setDraft((d) => ({ ...d, [g.key]: undefined }))} className="accent-accent" />
                        <span>Any</span>
                      </label>
                    </li>
                    {g.options.map((o) => (
                      <li key={o.value}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-ink-50">
                          <input type="radio" name={g.key} value={o.value} checked={draft[g.key] === o.value} onChange={() => setDraft((d) => ({ ...d, [g.key]: o.value }))} className="accent-accent" />
                          <span>{o.label} <span className="text-ink-500">({o.count})</span></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>
            ))}
          </div>
          <div className="flex gap-3 border-t border-ink-200 px-5 py-4">
            <button type="button" onClick={() => go({})} className={`${btnOutline} flex-1`}>Clear all</button>
            <button type="submit" className={`${btnPrimary} flex-1`}>Apply</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
