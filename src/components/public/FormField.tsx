import type { ReactNode } from "react";

/** Label + control + inline error, wired with aria so screen readers read the error. */
export function Field({ id, label, error, hint, children, className = "" }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-bad">{error}</p>}
    </div>
  );
}

/** Hidden trap for bots: people never see or fill it. */
export function Honeypot() {
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** +91 prefix box for the mobile number input. */
export function PhoneInput({ id, name = "phone", defaultValue, invalid, className = "" }: { id: string; name?: string; defaultValue?: string; invalid?: boolean; className?: string }) {
  return (
    <div className={`flex items-stretch rounded-md border bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${invalid ? "border-bad" : "border-ink-200"} ${className}`}>
      <span className="flex items-center border-r border-ink-200 px-3 text-ink-700" aria-hidden="true">+91</span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="10-digit mobile number"
        defaultValue={defaultValue}
        required
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className="min-w-0 flex-1 rounded-r-md bg-transparent px-3 py-2.5 text-ink-900 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}
