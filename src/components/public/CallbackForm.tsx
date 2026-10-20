"use client";

import { useActionState } from "react";
import { submitCallback } from "@/app/actions/enquiry";
import { Field, Honeypot, PhoneInput } from "./FormField";
import { PhoneIcon } from "./icons";
import { btnPrimary, inputCls } from "./ui";

/** "Want us to call you?" box. `layout="row"` lays the fields out in a line on wide screens. */
export function CallbackForm({ packageId, layout = "stack", idPrefix = "cb" }: { packageId?: number; layout?: "stack" | "row"; idPrefix?: string }) {
  const [state, action, pending] = useActionState(submitCallback, { ok: false });
  const v = state.values ?? {};
  const err = state.errors ?? {};
  const row = layout === "row";

  return (
    <section aria-labelledby={`${idPrefix}-title`} className="rounded-xl border border-ink-200 bg-accent-soft/40 p-5">
      <h2 id={`${idPrefix}-title`} className="text-lg font-semibold text-ink-900">Want us to call you?</h2>
      {state.ok ? (
        <p role="status" className="mt-4 rounded-md bg-good/10 p-3 font-medium text-good" data-testid="callback-success">{state.message}</p>
      ) : (
        <form action={action} noValidate className={`relative mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 ${row ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start" : ""}`}>
          {packageId !== undefined && <input type="hidden" name="packageId" value={packageId} />}
          <Honeypot />
          {state.message && <p role="alert" className="rounded-md bg-bad/10 p-2 text-sm text-bad md:col-span-3">{state.message}</p>}
          <Field id={`${idPrefix}-name`} label="Full name *" error={err.name}>
            <input id={`${idPrefix}-name`} name="name" required autoComplete="name" defaultValue={v.name} aria-invalid={!!err.name || undefined} aria-describedby={err.name ? `${idPrefix}-name-error` : undefined} className={inputCls} />
          </Field>
          <Field id={`${idPrefix}-phone`} label="Mobile number *" error={err.phone}>
            <PhoneInput id={`${idPrefix}-phone`} defaultValue={v.phone} invalid={!!err.phone} />
          </Field>
          <div className={row ? "md:mt-6" : ""}>
            <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
              <PhoneIcon className="h-4 w-4" />
              {pending ? "Sending..." : "Request Call Back"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
