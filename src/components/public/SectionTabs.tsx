"use client";

import { useEffect, useState } from "react";
import { focusRing } from "./ui";

const TABS = [
  { id: "itinerary", label: "Itinerary" },
  { id: "tour-info", label: "Tour Information" },
  { id: "cancellation", label: "Cancellation Policy" },
];

/** Sticky tab bar; highlights the section currently in view. */
export function SectionTabs() {
  const [active, setActive] = useState(TABS[0].id);

  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Package sections" className="sticky top-0 z-20 -mx-4 border-b border-ink-200 bg-white px-4 shadow-sm print:hidden">
      <ul className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "true" : undefined}
              onClick={() => setActive(t.id)}
              className={`block whitespace-nowrap border-b-2 px-4 py-3 font-medium ${focusRing} ${active === t.id ? "border-accent text-accent" : "border-transparent text-ink-500 hover:text-ink-900"}`}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
