"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { focusRing } from "./ui";

/** Shows its children behind a "Read more" toggle. */
export function ReadMore({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <div id={id} hidden={!open}>{children}</div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`mt-1 inline-flex items-center gap-1 font-medium text-ink-900 underline ${focusRing}`}>
        {open ? "Read less" : "Read more"}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
