"use client";

import { createContext, useActionState, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { BRAND } from "@/lib/config";
import { Field, Honeypot, PhoneInput } from "./FormField";
import { CloseIcon, MailIcon, PhoneIcon } from "./icons";
import { btnPrimary, focusRing, inputCls } from "./ui";

export interface EnquiryTarget { id: number; title: string }
interface Ctx { open: (pkg?: EnquiryTarget | null) => void }

const EnquiryCtx = createContext<Ctx>({ open: () => {} });
export const useEnquiry = () => useContext(EnquiryCtx);

export function EnquiryProvider({ children, email }: { children: ReactNode; email: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pkg, setPkg] = useState<EnquiryTarget | null>(null);
  const [nonce, setNonce] = useState(0);
  const [minDate, setMinDate] = useState("");

  const open = useCallback((target?: EnquiryTarget | null) => {
    setPkg(target ?? null);
    setNonce((n) => n + 1);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setMinDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <EnquiryCtx.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="enquiry-title"
        onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
        className="m-auto max-h-[92vh] w-[min(94vw,720px)] overflow-y-auto rounded-lg bg-white p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/60"
      >
        <EnquiryForm key={nonce} pkg={pkg} minDate={minDate} email={email} onClose={() => dialogRef.current?.close()} />
      </dialog>
    </EnquiryCtx.Provider>
  );
}

function EnquiryForm({ pkg, minDate, email, onClose }: { pkg: EnquiryTarget | null; minDate: string; email: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(submitEnquiry, { ok: false });
  const v = state.values ?? {};
  const err = state.errors ?? {};

  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 id="enquiry-title" className="text-2xl font-semibold">Enquire now</h2>
        <button type="button" onClick={onClose} aria-label="Close enquiry form" className={`rounded-full p-1.5 text-ink-700 hover:bg-ink-100 ${focusRing}`}>
          <CloseIcon />
        </button>
      </div>
      <p className="mt-2 text-ink-500">
        Tell us what you want and we will design the holiday around you{pkg ? <> — starting from <strong className="text-ink-900">{pkg.title}</strong></> : null}.
      </p>

      {state.ok ? (
        <div className="mt-6 rounded-md border border-good/30 bg-good/10 p-4" role="status" data-testid="enquiry-success">
          <p className="font-semibold text-good">{state.message}</p>
          <button type="button" onClick={onClose} className={`${btnPrimary} mt-4`}>Close</button>
        </div>
      ) : (
        <form action={action} noValidate className="relative mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {pkg && <input type="hidden" name="packageId" value={pkg.id} />}
          <Honeypot />
          {state.message && (
            <p role="alert" className="rounded-md bg-bad/10 p-3 text-sm text-bad sm:col-span-2" data-testid="enquiry-form-error">{state.message}</p>
          )}
          <Field id="enq-name" label="Full name *" error={err.name}>
            <input id="enq-name" name="name" required autoComplete="name" defaultValue={v.name} aria-invalid={!!err.name || undefined} aria-describedby={err.name ? "enq-name-error" : undefined} className={inputCls} />
          </Field>
          <Field id="enq-phone" label="Mobile number *" error={err.phone}>
            <PhoneInput id="enq-phone" defaultValue={v.phone} invalid={!!err.phone} />
          </Field>
          <Field id="enq-email" label="Email (optional)" error={err.email}>
            <input id="enq-email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={!!err.email || undefined} aria-describedby={err.email ? "enq-email-error" : undefined} className={inputCls} />
          </Field>
          <Field id="enq-date" label="Travel date (optional)" error={err.travelDate}>
            <input id="enq-date" name="travelDate" type="date" min={minDate || undefined} defaultValue={v.travelDate} aria-invalid={!!err.travelDate || undefined} aria-describedby={err.travelDate ? "enq-date-error" : undefined} className={inputCls} />
          </Field>
          <Field id="enq-adults" label="Adults" error={err.adults}>
            <input id="enq-adults" name="adults" type="number" min={1} max={20} defaultValue={v.adults ?? "2"} aria-invalid={!!err.adults || undefined} aria-describedby={err.adults ? "enq-adults-error" : undefined} className={inputCls} />
          </Field>
          <Field id="enq-children" label="Children" error={err.children}>
            <input id="enq-children" name="children" type="number" min={0} max={20} defaultValue={v.children ?? "0"} aria-invalid={!!err.children || undefined} aria-describedby={err.children ? "enq-children-error" : undefined} className={inputCls} />
          </Field>
          <Field id="enq-message" label="What's on your mind?" error={err.message} className="sm:col-span-2">
            <textarea id="enq-message" name="message" rows={3} maxLength={1000} defaultValue={v.message} aria-invalid={!!err.message || undefined} aria-describedby={err.message ? "enq-message-error" : undefined} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Sending..." : "Send Message"}</button>
          </div>
        </form>
      )}

      <div className="mt-7 grid gap-5 border-t border-ink-200 pt-5 sm:grid-cols-2">
        <div className="flex gap-3">
          <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
          <div>
            <h3 className="font-semibold">Give us a ring</h3>
            <p className="text-sm text-ink-500">Call us or leave your details and we will get in touch soon.</p>
            <a className="mt-1 inline-block font-semibold text-accent" href={BRAND.phoneHref}>{BRAND.phone}</a>
          </div>
        </div>
        <div className="flex gap-3">
          <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
          <div>
            <h3 className="font-semibold">Write to us</h3>
            <p className="text-sm text-ink-500">An enquiry, a question or a simple suggestion: write to us.</p>
            <a className="mt-1 inline-block break-all font-semibold text-accent" href={`mailto:${email}`}>{email}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Any "Enquire Now" / "Email itinerary" button: opens the modal with the package preselected. */
export function EnquiryButton({ pkg, className, children }: { pkg?: EnquiryTarget | null; className?: string; children: ReactNode }) {
  const { open } = useEnquiry();
  return (
    <button type="button" onClick={() => open(pkg)} className={className}>
      {children}
    </button>
  );
}
