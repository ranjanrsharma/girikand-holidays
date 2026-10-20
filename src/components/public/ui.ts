/** Shared class strings so buttons, inputs and focus rings look the same everywhere. */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
export const wrap = "mx-auto w-full max-w-6xl px-4";
export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-center font-semibold text-ink-900 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
export const btnOutline = `inline-flex items-center justify-center gap-2 rounded-md border border-ink-200 bg-white px-4 py-2.5 text-center font-medium text-ink-900 hover:bg-ink-50 ${focusRing}`;
export const inputCls = `w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 text-ink-900 placeholder:text-ink-500 ${focusRing}`;
export const linkCls = `text-accent underline underline-offset-2 hover:text-ink-900 ${focusRing}`;
