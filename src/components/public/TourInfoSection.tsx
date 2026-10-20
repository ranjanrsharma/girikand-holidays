"use client";

import { useState } from "react";
import { focusRing } from "./ui";

export function TourInfoSection({ inclusions, exclusions, needToKnow }: { inclusions: string[]; exclusions: string[]; needToKnow: string[] }) {
  const [tab, setTab] = useState<"in" | "ex">("in");
  const list = tab === "in" ? inclusions : exclusions;
  const tabCls = (active: boolean) =>
    `flex-1 rounded-t-lg px-4 py-3 font-semibold ${focusRing} ${active ? "bg-accent text-white" : "bg-accent-soft text-accent hover:bg-white"}`;
  return (
    <section id="tour-info" aria-labelledby="info-title" className="scroll-mt-16 py-8">
      <h2 id="info-title" className="text-2xl font-semibold">Tour Information</h2>
      <p className="mb-4 italic text-ink-500">Read this to prepare for your tour in the best way.</p>
      <div role="tablist" aria-label="Inclusions and exclusions" className="flex gap-1">
        <button type="button" role="tab" id="tab-in" aria-selected={tab === "in"} aria-controls="panel-in" onClick={() => setTab("in")} className={tabCls(tab === "in")}>Tour Inclusions</button>
        <button type="button" role="tab" id="tab-ex" aria-selected={tab === "ex"} aria-controls="panel-in" onClick={() => setTab("ex")} className={tabCls(tab === "ex")}>Tour Exclusions</button>
      </div>
      <div id="panel-in" role="tabpanel" aria-labelledby={tab === "in" ? "tab-in" : "tab-ex"} className="rounded-b-lg border border-accent p-5">
        <ul className="space-y-3">
          {list.map((t, i) => (
            <li key={i} className="flex gap-3 text-ink-700">
              <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tab === "in" ? "bg-good" : "bg-bad"}`} />
              {t}
            </li>
          ))}
          {list.length === 0 && <li className="text-ink-500">Nothing listed.</li>}
        </ul>
      </div>
      {needToKnow.length > 0 && (
        <div className="mt-6 rounded-lg bg-ink-50 p-5">
          <h3 className="font-semibold">Need to know</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-700">
            {needToKnow.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
