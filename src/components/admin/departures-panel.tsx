"use client";

import { useState, useTransition } from "react";
import { bulkAddDeparturesAction, deleteDepartureAction, saveDepartureAction } from "@/app/admin/(dashboard)/packages/actions";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import type { Departure } from "@/lib/types";
import { ConfirmSubmit } from "./confirm-submit";
import { Check } from "./fields";
import type { DepartureFormState, FieldErrors } from "./schema";
import { btnPrimary, btnSecondary, btnSmall, inputCls, td, th } from "./ui";

const blank = (): DepartureFormState => ({
  date: "", departureCity: "", seatsTotal: "20", seatsLeft: "20", priceTwin: "", priceTriple: "", priceSingle: "",
  priceChildBed: "", priceChildNoBed: "", offerPriceTwin: "",
});
const fromDeparture = (d: Departure): DepartureFormState => ({
  date: d.date, departureCity: d.departureCity, seatsTotal: String(d.seatsTotal), seatsLeft: String(d.seatsLeft), priceTwin: String(d.priceTwin),
  priceTriple: d.priceTriple == null ? "" : String(d.priceTriple), priceSingle: d.priceSingle == null ? "" : String(d.priceSingle),
  priceChildBed: d.priceChildBed == null ? "" : String(d.priceChildBed), priceChildNoBed: d.priceChildNoBed == null ? "" : String(d.priceChildNoBed),
  offerPriceTwin: d.offerPriceTwin == null ? "" : String(d.offerPriceTwin),
});

const COLS: { key: keyof DepartureFormState; label: string; type: string; w: string }[] = [
  { key: "date", label: "Date", type: "date", w: "w-40" },
  { key: "departureCity", label: "Departure city", type: "text", w: "w-36" },
  { key: "seatsTotal", label: "Seats total", type: "number", w: "w-24" },
  { key: "seatsLeft", label: "Seats left", type: "number", w: "w-24" },
  { key: "priceTwin", label: "Twin price", type: "number", w: "w-28" },
  { key: "priceTriple", label: "Triple price", type: "number", w: "w-28" },
  { key: "priceSingle", label: "Single price", type: "number", w: "w-28" },
  { key: "priceChildBed", label: "Child with bed", type: "number", w: "w-28" },
  { key: "priceChildNoBed", label: "Child without bed", type: "number", w: "w-28" },
  { key: "offerPriceTwin", label: "Offer price (twin)", type: "number", w: "w-28" },
];

function EditRow({ packageId, departure, onDone }: { packageId: number; departure: Departure | null; onDone: () => void }) {
  const [v, setV] = useState<DepartureFormState>(departure ? fromDeparture(departure) : blank());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const label = departure ? `departure ${departure.date}` : "new departure";

  function save() {
    setMsg("");
    start(async () => {
      const r = await saveDepartureAction(packageId, departure?.id ?? null, v);
      if (r.ok) { setErrors({}); onDone(); } else { setErrors(r.errors); setMsg(r.errors._form ?? r.message); }
    });
  }
  const errList = Object.entries(errors).filter(([k]) => k !== "_form");

  return (
    <>
      <tr className="bg-accent-soft/40" onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); save(); } }}>
        {COLS.map((c) => (
          <td key={c.key} className={td}>
            <input
              type={c.type} min={c.type === "date" && !departure ? todayISO() : c.type === "number" ? 0 : undefined}
              aria-label={`${c.label} for ${label}`} aria-invalid={!!errors[c.key]} value={v[c.key]}
              onChange={(ev) => setV((s) => ({ ...s, [c.key]: ev.target.value }))}
              className={`${inputCls} ${c.w} ${errors[c.key] ? "border-bad" : ""}`}
            />
          </td>
        ))}
        <td className={`${td} whitespace-nowrap`}>
          <div className="flex gap-1">
            <button type="button" disabled={pending} className={`${btnPrimary} ${btnSmall}`} onClick={save}>{pending ? "Saving..." : departure ? "Save departure" : "Add departure"}</button>
            <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={onDone}>Cancel</button>
          </div>
        </td>
      </tr>
      <tr aria-live="polite" className="bg-accent-soft/40">
        <td colSpan={COLS.length + 1} className="px-3 pb-2 text-xs text-bad">
          {(errList.length > 0 || msg) && (
            <ul role="alert">
              {errList.map(([k, m]) => <li key={k}>{COLS.find((c) => c.key === k)?.label ?? k}: {m}</li>)}
              {msg && errList.length === 0 && <li>{msg}</li>}
            </ul>
          )}
        </td>
      </tr>
    </>
  );
}

const money = (n: number | null) => (n == null ? "–" : formatINR(n));
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DeparturesPanel({ packageId, departures }: { packageId: number; departures: Departure[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [note, setNote] = useState("");
  const [, start] = useTransition();
  const today = todayISO();

  function remove(id: number) {
    start(async () => {
      const r = await deleteDepartureAction(packageId, id);
      setNote(r.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Departures</h2>
        <div className="flex gap-2">
          <button type="button" className={btnPrimary} onClick={() => { setEditing("new"); setBulkOpen(false); }}>Add departure</button>
          <button type="button" className={btnSecondary} aria-expanded={bulkOpen} onClick={() => { setBulkOpen(!bulkOpen); setEditing(null); }}>Bulk add</button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-good">{note}</p>
      {bulkOpen && <BulkAdd packageId={packageId} onDone={(m) => { setNote(m); setBulkOpen(false); }} />}

      <div className="overflow-x-auto rounded-md border border-ink-200">
        <table className="w-full min-w-[1100px] divide-y divide-ink-200">
          <caption className="sr-only">Departures</caption>
          <thead className="bg-ink-50">
            <tr>
              {COLS.map((c) => <th key={c.key} scope="col" className={th}>{c.label}</th>)}
              <th scope="col" className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {editing === "new" && <EditRow packageId={packageId} departure={null} onDone={() => setEditing(null)} />}
            {departures.length === 0 && editing !== "new" && (
              <tr><td colSpan={COLS.length + 1} className={`${td} text-ink-500`}>No departures yet.</td></tr>
            )}
            {departures.map((d) =>
              editing === d.id ? (
                <EditRow key={d.id} packageId={packageId} departure={d} onDone={() => setEditing(null)} />
              ) : (
                <tr key={d.id} className={d.date < today ? "text-ink-500" : ""}>
                  <td className={`${td} whitespace-nowrap`}>{formatDate(d.date)}{d.date < today && <span className="ml-1 text-xs">(past)</span>}</td>
                  <td className={td}>{d.departureCity}</td>
                  <td className={td}>{d.seatsTotal}</td>
                  <td className={td}>
                    {d.seatsLeft === 0 ? <span className="rounded-full bg-bad/15 px-2 py-0.5 text-xs font-semibold text-bad">Sold out</span> : d.seatsLeft}
                  </td>
                  <td className={td}>{money(d.priceTwin)}</td>
                  <td className={td}>{money(d.priceTriple)}</td>
                  <td className={td}>{money(d.priceSingle)}</td>
                  <td className={td}>{money(d.priceChildBed)}</td>
                  <td className={td}>{money(d.priceChildNoBed)}</td>
                  <td className={td}>{money(d.offerPriceTwin)}</td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Edit departure ${d.date} ${d.departureCity}`} onClick={() => { setEditing(d.id); setBulkOpen(false); }}>Edit</button>
                      <ConfirmSubmit label="Delete" what={`departure ${d.date} ${d.departureCity}`} onConfirm={() => remove(d.id)} />
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkAdd({ packageId, onDone }: { packageId: number; onDone: (msg: string) => void }) {
  const [v, setV] = useState({ ...blank(), date: "" });
  const [fromDate, setFrom] = useState("");
  const [toDate, setTo] = useState(addDays(todayISO(), 60));
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof DepartureFormState, val: string) => setV((s) => ({ ...s, [k]: val, ...(k === "seatsTotal" && s.seatsLeft === s.seatsTotal ? { seatsLeft: val } : {}) }));

  function run() {
    setMsg("");
    start(async () => {
      const r = await bulkAddDeparturesAction(packageId, { ...v, fromDate, toDate, weekdays });
      if (r.ok) onDone(r.message);
      else { setErrors(r.errors); setMsg(r.message); }
    });
  }
  const f = (id: string, label: string, key: keyof DepartureFormState | "fromDate" | "toDate", value: string, onChange: (s: string) => void, type = "text") => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={id} type={type} value={value} onChange={(ev) => onChange(ev.target.value)} aria-invalid={!!errors[key]} className={`${inputCls} ${errors[key] ? "border-bad" : ""}`} />
      <div aria-live="polite">{errors[key] && <p className="mt-1 text-xs text-bad">{errors[key]}</p>}</div>
    </div>
  );
  return (
    <section aria-label="Bulk add departures" className="space-y-3 rounded-md border border-ink-200 bg-ink-50 p-4">
      <h3 className="font-semibold">Bulk add departures</h3>
      <p className="text-sm text-ink-500">Creates one departure for each chosen weekday between the two dates, with the same city, seats and prices. Past dates and existing departures are skipped.</p>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {f("bulk-from", "From date", "fromDate", fromDate, setFrom, "date")}
        {f("bulk-to", "To date", "toDate", toDate, setTo, "date")}
        {f("bulk-city", "Departure city", "departureCity", v.departureCity, (s) => set("departureCity", s))}
        {f("bulk-total", "Seats total", "seatsTotal", v.seatsTotal, (s) => set("seatsTotal", s), "number")}
        {f("bulk-left", "Seats left", "seatsLeft", v.seatsLeft, (s) => set("seatsLeft", s), "number")}
        {f("bulk-twin", "Twin price", "priceTwin", v.priceTwin, (s) => set("priceTwin", s), "number")}
        {f("bulk-triple", "Triple price", "priceTriple", v.priceTriple, (s) => set("priceTriple", s), "number")}
        {f("bulk-single", "Single price", "priceSingle", v.priceSingle, (s) => set("priceSingle", s), "number")}
        {f("bulk-cbed", "Child with bed", "priceChildBed", v.priceChildBed, (s) => set("priceChildBed", s), "number")}
        {f("bulk-cnobed", "Child without bed", "priceChildNoBed", v.priceChildNoBed, (s) => set("priceChildNoBed", s), "number")}
        {f("bulk-offer", "Offer price (twin)", "offerPriceTwin", v.offerPriceTwin, (s) => set("offerPriceTwin", s), "number")}
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Weekdays</legend>
        <div className="flex flex-wrap gap-4">
          {WEEKDAYS.map((w, i) => (
            <Check key={w} id={`bulk-wd-${i}`} label={w} checked={weekdays.includes(i)} onChange={(on) => setWeekdays(on ? [...weekdays, i] : weekdays.filter((x) => x !== i))} />
          ))}
        </div>
        <div aria-live="polite">{errors.weekdays && <p className="mt-1 text-xs text-bad">{errors.weekdays}</p>}</div>
      </fieldset>
      <div aria-live="polite">{msg && <p role="alert" className="text-sm text-bad">{msg}</p>}</div>
      <button type="button" disabled={pending} className={btnPrimary} onClick={run}>{pending ? "Creating..." : "Create departures"}</button>
    </section>
  );
}
