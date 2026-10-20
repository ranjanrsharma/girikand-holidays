"use client";

import { useId, useState } from "react";
import { addDays, formatDateShort } from "@/lib/dates";
import type { ItineraryDay } from "@/lib/types";
import { useDeparture } from "./DepartureProvider";
import { useEnquiry } from "./EnquiryProvider";
import { MailIcon, MinusIcon, PinIcon, PlusIcon, PrintIcon } from "./icons";
import { focusRing } from "./ui";

const MEAL_NAMES: Record<string, string> = { B: "Breakfast", L: "Lunch", D: "Dinner" };

export function ItinerarySection({ days, pkg }: { days: ItineraryDay[]; pkg: { id: number; title: string } }) {
  const { selected } = useDeparture();
  const { open: openEnquiry } = useEnquiry();
  const base = useId();
  const [openDays, setOpenDays] = useState<Set<number>>(new Set());
  const allOpen = days.length > 0 && openDays.size === days.length;

  const toggle = (i: number) =>
    setOpenDays((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  return (
    <section id="itinerary" aria-labelledby="itinerary-title" className="scroll-mt-16 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="itinerary-title" className="text-2xl font-semibold">Itinerary <span className="text-base font-normal italic text-ink-500">(Day Wise)</span></h2>
        <button type="button" onClick={() => setOpenDays(allOpen ? new Set() : new Set(days.map((_, i) => i)))} className={`font-medium text-ink-900 underline print:hidden ${focusRing}`}>
          {allOpen ? "Hide all days" : "View all days"}
        </button>
      </div>

      <ol className="mt-4">
        {days.map((d, i) => {
          const isOpen = openDays.has(i);
          const id = `${base}-day-${i}`;
          const date = selected ? formatDateShort(addDays(selected.date, i)) : null;
          const meta = [d.distanceKm ? `Approx. ${d.distanceKm} kms` : null, d.driveTime || null].filter(Boolean).join("; ");
          return (
            <li key={i} className="relative border-l border-dashed border-ink-200 pb-5 pl-7 last:border-transparent">
              <PinIcon className={`absolute -left-3 -top-0.5 h-6 w-6 bg-white ${i === 0 ? "text-accent" : "text-ink-500"}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-semibold ${i === 0 ? "text-accent" : "text-ink-900"}`} data-testid="day-title">
                    Day {i + 1}{date ? ` / ${date}` : ""} - {d.title}
                  </h3>
                  {meta && <p className="text-sm text-ink-500">({meta})</p>}
                </div>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} day ${i + 1}`}
                  onClick={() => toggle(i)}
                  className={`shrink-0 rounded-full bg-ink-100 p-2 hover:bg-ink-200 print:hidden ${focusRing}`}
                >
                  {isOpen ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                </button>
              </div>
              <div id={id} className={`${isOpen ? "block" : "hidden"} mt-2 print:block`}>
                <p className="text-ink-700">{d.description}</p>
                {d.meals && d.meals.length > 0 && (
                  <ul aria-label="Meals included" className="mt-2 flex flex-wrap gap-2">
                    {d.meals.map((m) => <li key={m} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{MEAL_NAMES[m] ?? m}</li>)}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex flex-wrap justify-center gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className={`inline-flex items-center gap-2 rounded-md border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 ${focusRing}`}>
          <PrintIcon className="h-4 w-4 text-accent" /> Print Itinerary
        </button>
        <button type="button" onClick={() => openEnquiry(pkg)} className={`inline-flex items-center gap-2 rounded-md border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 ${focusRing}`}>
          <MailIcon className="h-4 w-4 text-accent" /> Email Itinerary
        </button>
      </div>
    </section>
  );
}
