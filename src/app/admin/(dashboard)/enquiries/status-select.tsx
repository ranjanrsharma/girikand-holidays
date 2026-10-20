"use client";

import { useState, useTransition } from "react";
import type { EnquiryStatus } from "@/lib/types";
import { inputCls } from "@/components/admin/ui";
import { setEnquiryStatusAction } from "../actions";

const OPTIONS: EnquiryStatus[] = ["new", "contacted", "booked", "lost"];

export function StatusSelect({ id, status, who }: { id: number; status: EnquiryStatus; who: string }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div>
      <select
        aria-label={`Status for ${who}`}
        className={`${inputCls} !w-auto capitalize`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as EnquiryStatus;
          const prev = value;
          setValue(next);
          setMsg("");
          start(async () => {
            const r = await setEnquiryStatusAction(id, next);
            if (!r.ok) { setValue(prev); setMsg("Could not save"); } else setMsg("Saved");
          });
        }}
      >
        {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span aria-live="polite" className={`ml-2 text-xs ${msg === "Saved" ? "text-good" : "text-bad"}`}>{msg}</span>
    </div>
  );
}
