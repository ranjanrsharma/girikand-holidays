# Girikand Holidays — package site

Public site where visitors browse customized holiday packages, filter them, and send an enquiry; staff manage packages in an admin area. Enquiry only (no online booking or payment). English and INR. Two packages at launch.

## Stack
Next.js 16 (App Router, TypeScript), Tailwind v4, Postgres via `postgres` (hosted) or embedded PGlite (local), `jose` for the admin cookie, `zod` for form validation, Vitest, Playwright.
**Next.js here has breaking changes from older versions: read the relevant page in `node_modules/next/dist/docs/` before using an API** (`params`, `searchParams`, `cookies()` are async).

## Commands
- `npm run dev` — local site; an empty local database seeds itself with two demo packages
- `npm run check` — typecheck, lint and unit tests; run before every commit
- `npm test` — unit tests only (`npm test -- cancellation` for one file)
- `npm run e2e` — Playwright browser tests (start nothing by hand; the config starts the server)
- Admin login locally: see `.env.local` (copy of `.env.example`)

## Layout
- `db/schema.sql` — the whole schema (3 tables); `db/seed-data.ts` — demo data
- `src/lib/` — shared logic. Data access is `packages.ts`; money, dates and cancellation maths have tests
- `src/app/(public)/` and `src/components/public/` — visitor pages; `src/app/admin/` and `src/components/admin/` — staff pages
- Colours and fonts are tokens in `src/app/globals.css`; use token classes (`bg-brand`, `text-ink-900`), never hex values in components

## Rules that are easy to get wrong
- Money is whole rupees in the database; show with `formatINR` (₹1,25,000). Never format by hand.
- Dates are ISO strings (`YYYY-MM-DD`). Use `src/lib/dates.ts`; never `new Date(x).toLocaleDateString` (timezone shifts a day).
- Cancellation date ranges are computed from the chosen departure date (`computeSlabs`), not stored.
- Every admin server action must call `requireAdmin()` first; the admin layout alone does not protect actions.
- Prices and seats come from departures; a package with no upcoming bookable departure shows no price.
- Do not copy text, photos or logos from other travel sites. Use original copy and the placeholder image component until real photos are supplied.

## Workflow
- Plan first for anything touching more than one file; keep each change small and checked.
- One branch and pull request per feature; run `npm run check` and show its output before saying done.
- UI changes: take a Playwright screenshot and compare with the reference screenshots in the project folder (`/mnt/project-files/uploads/hearth/`).
- Never commit `.env.local` or `.data/`.

## Hosted Postgres
Local dev uses PGlite, hosted uses the `postgres` driver; they differ on JSON parameters. Always pass JSON as `$n::text::jsonb` (already done in `savePackage`), and after changing queries run the app once against a real Postgres via `DATABASE_URL`.
