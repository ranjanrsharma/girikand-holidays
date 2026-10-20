"use client";

import { useEffect } from "react";
import { formatDate, formatMonth } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import type { Departure } from "@/lib/types";
import { ROOMS, roomPrice, useDeparture, type RoomKey } from "./DepartureProvider";
import { EnquiryButton } from "./EnquiryProvider";
import { CalendarIcon } from "./icons";
import { btnPrimary, focusRing } from "./ui";

function seatsLabel(d: Departure) {
  if (d.status === "sold-out") return <span className="font-semibold text-bad">Sold out</span>;
  if (d.status === "few-left") return <span className="font-semibold text-warn">Only {d.seatsLeft} seats left</span>;
  return <span className="text-good">Seats available</span>;
}

export function DeparturesSection({ pkg }: { pkg: { id: number; title: string } }) {
  const { departures, priceHidden, selected, select, room, setRoom } = useDeparture();

  // ?scrollTo=date jumps straight to this section.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("scrollTo") === "date") {
      document.getElementById("dates")?.scrollIntoView({ block: "start" });
    }
  }, []);

  const rooms = ROOMS.filter((r) => r.key === "twin" || departures.some((d) => roomPrice(d, r.key) !== null));
  const months = [...new Set(departures.map((d) => d.date.slice(0, 7)))];

  return (
    <section id="dates" aria-labelledby="dates-title" className="scroll-mt-4 py-8 print:hidden">
      <h2 id="dates-title" className="flex items-center gap-2 text-2xl font-semibold"><CalendarIcon className="h-6 w-6 text-accent" /> Dates &amp; Availability</h2>

      {departures.length === 0 ? (
        <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-5" data-testid="no-departures">
          <p className="font-semibold">No upcoming departures, enquire for dates</p>
          <p className="mt-1 text-ink-700">Tell us when you would like to travel and we will check availability for you.</p>
          <EnquiryButton pkg={pkg} className={`${btnPrimary} mt-4`}>Enquire Now</EnquiryButton>
        </div>
      ) : (
        <>
          {!priceHidden && rooms.length > 1 && (
            <div role="radiogroup" aria-label="Room type" className="mt-4 flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  role="radio"
                  aria-checked={room === r.key}
                  onClick={() => setRoom(r.key as RoomKey)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${focusRing} ${room === r.key ? "border-accent bg-accent text-white" : "border-ink-200 bg-white hover:bg-ink-50"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 space-y-6">
            {months.map((m) => (
              <div key={m}>
                <h3 className="mb-2 font-semibold text-ink-700">{formatMonth(m)}</h3>
                <ul role="radiogroup" aria-label={`Departures in ${formatMonth(m)}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {departures.filter((d) => d.date.startsWith(m)).map((d) => {
                    const soldOut = d.status === "sold-out";
                    const isSel = selected?.id === d.id;
                    const price = roomPrice(d, room);
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSel}
                          disabled={soldOut}
                          onClick={() => select(d.id)}
                          data-testid="departure"
                          className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left ${focusRing} ${soldOut ? "cursor-not-allowed border-ink-200 bg-ink-100 text-ink-500" : isSel ? "border-accent bg-accent-soft" : "border-ink-200 bg-white hover:border-accent"}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink-900">{formatDate(d.date)}</span>
                            {isSel && <span className="rounded bg-accent px-1.5 text-xs font-semibold text-white">Selected</span>}
                          </span>
                          <span className="text-sm text-ink-700">{d.departureCity} departure</span>
                          <span className="text-sm">{seatsLabel(d)}</span>
                          <span className="mt-1 text-sm">
                            {priceHidden ? (
                              <span className="text-ink-700">Price on request</span>
                            ) : price === null ? (
                              <span className="text-ink-500">Not available for this room type</span>
                            ) : (
                              <>
                                {room === "twin" && d.offerPriceTwin !== null && <span className="mr-1.5 text-ink-500 line-through">{formatINR(d.priceTwin)}</span>}
                                <strong className="text-base text-ink-900">{formatINR(price)}</strong> <span className="text-ink-500">per person</span>
                              </>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
