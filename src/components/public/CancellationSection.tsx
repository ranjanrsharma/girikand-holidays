"use client";

import { computeSlabs } from "@/lib/cancellation";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import type { CancellationSlab, PaymentSector } from "@/lib/types";
import { CalendarIcon } from "./icons";
import { roomPrice, useDeparture } from "./DepartureProvider";
import { EnquiryButton } from "./EnquiryProvider";
import { focusRing, inputCls } from "./ui";

/** Left bar colour: green for small deductions, amber in the middle, red when nothing is refunded. */
function barClass(percent: number) {
  if (percent <= 20) return "border-l-good";
  if (percent < 100) return "border-l-warn";
  return "border-l-bad";
}

export function CancellationSection({ pkg, slabs, notes, paymentTerms, remarks }: {
  pkg: { id: number; title: string };
  slabs: CancellationSlab[];
  notes: string[];
  paymentTerms: PaymentSector[];
  remarks: string[];
}) {
  const { departures, selected, select, priceHidden } = useDeparture();
  const bookable = departures.filter((d) => d.status !== "sold-out");
  const price = selected && !priceHidden ? roomPrice(selected, "twin") : null;
  const rows = selected ? computeSlabs(slabs, selected.date, price ?? 0) : [];

  return (
    <section id="cancellation" aria-labelledby="cancel-title" className="scroll-mt-16 py-8">
      <h2 id="cancel-title" className="text-2xl font-semibold">Cancellation Policy &amp; Payment Terms</h2>

      {selected ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-semibold text-accent" data-testid="cancel-departure">{selected.departureCity} departure, {formatDate(selected.date)}</p>
            <label className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              <span className="underline">Change departure date</span>
              <select value={selected.id} onChange={(e) => select(Number(e.target.value))} className={`${inputCls} w-auto py-1.5 text-sm`}>
                {bookable.map((d) => <option key={d.id} value={d.id}>{d.departureCity}, {formatDate(d.date)}</option>)}
              </select>
            </label>
          </div>
          {price !== null && (
            <p className="mt-4">
              Tour price: <strong className="text-lg" data-testid="cancel-price" data-price={price}>{formatINR(price)}</strong>{" "}
              <span className="text-sm text-ink-500">per person on twin sharing</span>
            </p>
          )}
          <p className="mb-3 text-sm text-ink-500">Charges rise as departure gets closer.</p>
          <ul className="space-y-2" data-testid="cancel-table">
            {rows.map((r) => (
              <li
                key={r.percent + "-" + r.fromDays}
                data-testid={`slab-${r.percent}`}
                data-amount={price !== null ? r.amount : undefined}
                className={`grid gap-1 rounded-lg border border-l-4 border-ink-200 bg-white px-4 py-3 sm:grid-cols-[1.4fr_1fr_1.2fr] sm:items-center sm:gap-4 ${barClass(r.percent)}`}
              >
                <p>
                  {price !== null && <strong className="text-lg" data-testid="slab-amount">{formatINR(r.amount)}</strong>}{" "}
                  <span className="text-sm text-ink-500">({r.percent}% deduction from tour amount)</span>
                </p>
                <p className="font-medium">{r.fromDays}-{r.toDays} days prior</p>
                <p className="text-ink-500">{formatDate(r.startDate)} - {formatDate(r.endDate)}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-ink-50 p-4 text-ink-700">
          Cancellation charges depend on the departure date. There is no bookable departure right now:{" "}
          <EnquiryButton pkg={pkg} className={`font-medium text-accent underline ${focusRing}`}>enquire for dates</EnquiryButton>.
        </p>
      )}

      {notes.length > 0 && (
        <ul className="mt-5 list-disc space-y-1 rounded-lg bg-ink-50 p-5 pl-9 text-sm text-ink-700">
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      {paymentTerms.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold">Payment Terms</h3>
          <div className="space-y-4">
            {paymentTerms.map((s) => (
              <div key={s.sector} className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <caption className="bg-ink-900 px-4 py-2.5 text-left text-sm font-semibold text-white">{s.sector}</caption>
                  <thead className="bg-ink-100">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-semibold">Booking payment schedule</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Payment policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, i) => (
                      <tr key={i} className="border-t border-ink-200">
                        <td className="px-4 py-2.5">{r.label}</td>
                        <td className="px-4 py-2.5">{r.payment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {remarks.length > 0 && (
        <div className="mt-6 rounded-lg bg-ink-50 p-5 text-sm">
          <h3 className="font-semibold text-bad">Remarks</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-700">
            {remarks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
