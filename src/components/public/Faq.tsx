"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./icons";
import { focusRing } from "./ui";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const open = openIdx === i;
        return (
          <li key={it.q} className="rounded-xl bg-white shadow-sm">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`faq-${i}`}
                onClick={() => setOpenIdx(open ? null : i)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left font-semibold text-ink-900 ${focusRing}`}
              >
                {it.q}
                <ChevronDownIcon className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </h3>
            <div id={`faq-${i}`} hidden={!open} className="px-5 pb-4 text-ink-700">{it.a}</div>
          </li>
        );
      })}
    </ul>
  );
}
