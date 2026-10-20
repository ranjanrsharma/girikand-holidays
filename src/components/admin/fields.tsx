"use client";

import type { ReactNode } from "react";
import { btnSecondary, btnSmall, inputCls } from "./ui";

/** Label + control + inline error (always-present aria-live region so errors are announced). */
export function Field({ id, label, error, hint, children, className = "" }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">{hint}</p>}
      <div aria-live="polite">{error && <p id={`${id}-err`} className="mt-1 text-xs text-bad">{error}</p>}</div>
    </div>
  );
}

interface BaseProps { id: string; label: string; error?: string; hint?: string; className?: string }

export function TextInput({ id, label, error, hint, className, value, onChange, type = "text", placeholder, min, max, maxLength }: BaseProps & {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; min?: number; max?: number; maxLength?: number;
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id} name={id} type={type} value={value} placeholder={placeholder} min={min} max={max} maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputCls} ${error ? "border-bad" : ""}`}
      />
    </Field>
  );
}

export function TextArea({ id, label, error, hint, className, value, onChange, rows = 4 }: BaseProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id} name={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined} className={`${inputCls} ${error ? "border-bad" : ""}`}
      />
    </Field>
  );
}

export function SelectInput({ id, label, error, hint, className, value, onChange, options }: BaseProps & {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <select id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} className={`${inputCls} ${error ? "border-bad" : ""}`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Check({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="inline-flex items-center gap-2 text-sm font-medium">
        <input id={id} name={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-accent" />
        {label}
      </label>
      {hint && <p className="ml-6 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** Repeatable single lines (highlights, inclusions...). */
export function LinesEditor({ id, label, values, onChange, errors, multiline = false, addLabel = "Add line", hint }: {
  id: string; label: string; values: string[]; onChange: (v: string[]) => void; errors?: Record<string, string>; multiline?: boolean; addLabel?: string; hint?: string;
}) {
  const set = (i: number, v: string) => onChange(values.map((x, j) => (j === i ? v : x)));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
      {values.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <textarea aria-label={`${label} ${i + 1}`} id={`${id}-${i}`} rows={2} value={v} onChange={(e) => set(i, e.target.value)} className={inputCls} />
          ) : (
            <input aria-label={`${label} ${i + 1}`} id={`${id}-${i}`} type="text" value={v} onChange={(e) => set(i, e.target.value)} className={inputCls} />
          )}
          <button type="button" className={`${btnSecondary} ${btnSmall} shrink-0`} aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}>Remove</button>
          <div aria-live="polite" className="sr-only">{errors?.[`${id}.${i}`]}</div>
        </div>
      ))}
      <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => onChange([...values, ""])}>{addLabel}</button>
    </fieldset>
  );
}
