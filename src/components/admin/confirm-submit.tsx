"use client";

import { useState } from "react";
import { btnDanger, btnSecondary, btnSmall } from "./ui";

/** Two-step destructive button. Inside a form the confirm click submits it; with onConfirm it calls that instead. */
export function ConfirmSubmit({ label, confirmLabel, what, onConfirm, disabled }: {
  label: string; confirmLabel?: string; what: string; onConfirm?: () => void; disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" disabled={disabled} className={`${btnDanger} ${btnSmall}`} onClick={() => setAsking(true)} aria-label={`${label} ${what}`}>
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label={`Confirm ${label.toLowerCase()} ${what}`}>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm ? () => { setAsking(false); onConfirm(); } : undefined}
        className={`${btnDanger} ${btnSmall} bg-bad !text-white hover:bg-bad/90`}
      >
        {confirmLabel ?? `Yes, ${label.toLowerCase()}`}
      </button>
      <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => setAsking(false)}>Cancel</button>
    </span>
  );
}
