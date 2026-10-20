// Server-safe shared module: form state shape, zod schemas and pure checks used by the admin editor and its actions.
import { z } from "zod";
import { DEFAULT_CANCELLATION_NOTES, DEFAULT_PAYMENT_TERMS, DEFAULT_SLABS } from "@/lib/cancellation";
import { INCLUDE_KEYS, MEAL_CODES, type IncludeKey } from "@/lib/config";
import { isRealDate, todayISO } from "@/lib/dates";
import type { Departure, IncludeState, ItineraryDay, PackageInput, PackageRecord } from "@/lib/types";

// ---------- form state (what the client editor holds; numbers stay strings while typing) ----------

export interface FormSlab { fromDays: string; toDays: string; percent: string }
export interface FormDay { title: string; description: string; city: string; distanceKm: string; driveTime: string; meals: string[] }
export interface PackageFormState {
  title: string; slug: string; code: string; badge: string; category: string; type: "customized" | "group";
  days: string; nights: string; region: "India" | "World"; country: string; state: string;
  cities: { name: string; nights: string }[];
  tags: string[]; overview: string; highlights: string[]; isFeatured: boolean; priceHidden: boolean;
  includes: Record<IncludeKey, IncludeState>; tourManager: boolean;
  itinerary: FormDay[];
  inclusions: string[]; exclusions: string[]; needToKnow: string[]; remarks: string[];
  cancellationSlabs: FormSlab[]; cancellationNotes: string[];
  paymentTerms: { sector: string; rows: { label: string; payment: string }[] }[];
  heroImage: string; gallery: string[]; publishWithoutPhoto: boolean;
}

export function slabsToForm(s: { fromDays: number; toDays: number; percent: number }[]): FormSlab[] {
  return [...s].sort((a, b) => a.fromDays - b.fromDays).map((x) => ({ fromDays: String(x.fromDays), toDays: String(x.toDays), percent: String(x.percent) }));
}

export function emptyForm(): PackageFormState {
  return {
    title: "", slug: "", code: "", badge: "", category: "family", type: "customized", days: "4", nights: "3",
    region: "India", country: "India", state: "", cities: [{ name: "", nights: "" }], tags: [], overview: "", highlights: [""],
    isFeatured: false, priceHidden: false,
    includes: { hotel: "yes", meals: "yes", flight: "no", sightseeing: "yes", transport: "yes", visa: "no" },
    tourManager: false, itinerary: [], inclusions: [""], exclusions: [""], needToKnow: [""], remarks: [""],
    cancellationSlabs: slabsToForm(DEFAULT_SLABS), cancellationNotes: [...DEFAULT_CANCELLATION_NOTES],
    paymentTerms: structuredClone(DEFAULT_PAYMENT_TERMS), heroImage: "", gallery: [""], publishWithoutPhoto: false,
  };
}

const orBlank = (a: string[]) => (a.length ? a : [""]);

export function recordToForm(p: PackageRecord): PackageFormState {
  const includes = { ...emptyForm().includes };
  for (const k of INCLUDE_KEYS) includes[k] = p.includes[k] ?? "no";
  return {
    title: p.title, slug: p.slug, code: p.code, badge: p.badge ?? "", category: p.category, type: p.type,
    days: String(p.days), nights: String(p.nights), region: p.region, country: p.country, state: p.state ?? "",
    cities: p.cities.length ? p.cities.map((c) => ({ name: c.name, nights: String(c.nights) })) : [{ name: "", nights: "" }],
    tags: p.tags, overview: p.overview, highlights: orBlank(p.highlights), isFeatured: p.isFeatured, priceHidden: p.priceHidden,
    includes, tourManager: p.tourManager,
    itinerary: p.itinerary.map((d) => ({
      title: d.title, description: d.description, city: d.city ?? "", distanceKm: d.distanceKm == null ? "" : String(d.distanceKm),
      driveTime: d.driveTime ?? "", meals: d.meals ?? [],
    })),
    inclusions: orBlank(p.inclusions), exclusions: orBlank(p.exclusions), needToKnow: orBlank(p.needToKnow), remarks: orBlank(p.remarks),
    cancellationSlabs: slabsToForm(p.cancellationSlabs), cancellationNotes: orBlank(p.cancellationNotes),
    paymentTerms: structuredClone(p.paymentTerms), heroImage: p.heroImage ?? "", gallery: orBlank(p.gallery), publishWithoutPhoto: false,
  };
}

// ---------- pure checks ----------

/** Returns an error message, or null when the slabs start at 0 with no gaps or overlaps. */
export function validateSlabs(slabs: { fromDays: number; toDays: number; percent: number }[]): string | null {
  if (slabs.length === 0) return "Add at least one cancellation slab.";
  if (slabs.some((s) => !Number.isInteger(s.fromDays) || !Number.isInteger(s.toDays) || s.fromDays < 0 || s.toDays < 0)) {
    return "Enter whole numbers of days (0 or more) in every slab.";
  }
  if (slabs.some((s) => !Number.isFinite(s.percent) || s.percent < 0 || s.percent > 100)) return "Percent must be between 0 and 100.";
  const sorted = [...slabs].sort((a, b) => a.fromDays - b.fromDays);
  if (sorted[0].fromDays !== 0) return "Slabs must start at 0 days (the last-minute slab).";
  for (const s of sorted) if (s.toDays < s.fromDays) return `Slab ${s.fromDays} to ${s.toDays}: the 'to' days must not be below the 'from' days.`;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (cur.fromDays > prev.toDays + 1) return `Gap: nothing covers ${prev.toDays + 1} to ${cur.fromDays - 1} days before departure.`;
    if (cur.fromDays <= prev.toDays) return `Overlap: ${cur.fromDays} to ${Math.min(prev.toDays, cur.toDays)} days is covered by two slabs.`;
  }
  return null;
}

export interface PublishCheck {
  days: number;
  itinerary: Pick<ItineraryDay, "title" | "description">[];
  heroImage: string | null;
  publishWithoutPhoto: boolean;
  departures: Pick<Departure, "date" | "priceTwin">[];
}

/** Reasons a package cannot be published yet (empty list means it can). */
export function publishProblems(c: PublishCheck): string[] {
  const out: string[] = [];
  const today = todayISO();
  if (!c.departures.some((d) => d.date >= today && d.priceTwin > 0)) out.push("add at least one upcoming departure with a price");
  if (!c.heroImage && !c.publishWithoutPhoto) out.push("add a hero image or tick 'publish without photo'");
  const filled = c.itinerary.filter((d) => d.title.trim() && d.description.trim()).length;
  if (c.itinerary.length < c.days || filled < c.days) out.push(`write an itinerary entry (title and description) for each of the ${c.days} days`);
  return out;
}

export function publishMessage(problems: string[]): string {
  return `Cannot publish yet: ${problems.join("; ")}.`;
}

// ---------- zod ----------

const lines = z.array(z.string().max(2000)).transform((a) => a.map((s) => s.trim()).filter(Boolean));
const int = (label: string, min: number, max: number) =>
  z.string().trim().min(1, `${label} is required`).regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number).refine((n) => n >= min && n <= max, `${label} must be between ${min} and ${max}`);
const optInt = (label: string, max = 100_000_000) =>
  z.string().trim().refine((v) => v === "" || /^\d+$/.test(v), `${label} must be a whole number`)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((n) => n === null || n <= max, `${label} is too large`);
const imageUrl = z.string().trim().refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v) || /^\/(?!\/)\S*$/.test(v), "Enter a full web address (https://...) or a path starting with /");

export const packageSchema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, "Code is 2 to 20 letters, numbers or hyphens, e.g. GHGA1"),
  badge: z.string().trim().max(60),
  category: z.string().trim().min(1, "Category is required").max(60),
  type: z.enum(["customized", "group"], "Choose a type"),
  days: int("Days", 1, 60),
  nights: int("Nights", 0, 60),
  region: z.enum(["India", "World"], "Choose a region"),
  country: z.string().trim().min(1, "Country is required").max(80),
  state: z.string().trim().max(80),
  cities: z.array(z.object({ name: z.string().trim().max(80), nights: z.string().trim().refine((v) => v === "" || /^\d+$/.test(v), "Nights must be a whole number") })),
  tags: z.array(z.string().trim().max(40)).transform((a) => [...new Set(a.filter(Boolean))]),
  overview: z.string().trim().max(5000),
  highlights: lines,
  isFeatured: z.boolean(),
  priceHidden: z.boolean(),
  includes: z.object(Object.fromEntries(INCLUDE_KEYS.map((k) => [k, z.enum(["yes", "no", "optional"])])) as Record<IncludeKey, z.ZodEnum<{ yes: "yes"; no: "no"; optional: "optional" }>>),
  tourManager: z.boolean(),
  itinerary: z.array(z.object({
    title: z.string().trim().max(200),
    description: z.string().trim().max(3000),
    city: z.string().trim().max(80),
    distanceKm: optInt("Distance", 5000),
    driveTime: z.string().trim().max(40),
    meals: z.array(z.string()).transform((m) => MEAL_CODES.filter((c) => m.includes(c)) as string[]),
  })),
  inclusions: lines,
  exclusions: lines,
  needToKnow: lines,
  remarks: lines,
  cancellationSlabs: z.array(z.object({ fromDays: int("From days", 0, 3650), toDays: int("To days", 0, 3650), percent: int("Percent", 0, 100) })),
  cancellationNotes: lines,
  paymentTerms: z.array(z.object({
    sector: z.string().trim().max(200),
    rows: z.array(z.object({ label: z.string().trim().max(300), payment: z.string().trim().max(300) })),
  })),
  heroImage: imageUrl,
  gallery: z.array(imageUrl),
  publishWithoutPhoto: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.nights > v.days) ctx.addIssue({ code: "custom", path: ["nights"], message: "Nights cannot be more than days" });
  const msg = validateSlabs(v.cancellationSlabs);
  if (msg) ctx.addIssue({ code: "custom", path: ["cancellationSlabs"], message: msg });
});

export type ParsedPackage = z.output<typeof packageSchema>;

export function toPackageInput(v: ParsedPackage, status: PackageRecord["status"]): PackageInput {
  return {
    slug: v.slug, code: v.code, title: v.title, category: v.category, type: v.type, badge: v.badge || null,
    days: v.days, nights: v.nights, overview: v.overview, highlights: v.highlights, heroImage: v.heroImage || null,
    gallery: v.gallery.filter(Boolean), region: v.region, country: v.country, state: v.state || null,
    cities: v.cities.filter((c) => c.name).map((c) => ({ name: c.name, nights: c.nights ? Number(c.nights) : 0 })),
    tags: v.tags, includes: v.includes, tourManager: v.tourManager,
    itinerary: v.itinerary.map((d) => ({
      title: d.title, description: d.description, city: d.city || undefined, distanceKm: d.distanceKm, driveTime: d.driveTime || null, meals: d.meals,
    })),
    inclusions: v.inclusions, exclusions: v.exclusions, needToKnow: v.needToKnow,
    cancellationSlabs: [...v.cancellationSlabs].sort((a, b) => b.fromDays - a.fromDays),
    cancellationNotes: v.cancellationNotes,
    paymentTerms: v.paymentTerms.map((s) => ({ sector: s.sector, rows: s.rows.filter((r) => r.label || r.payment) })).filter((s) => s.sector || s.rows.length),
    remarks: v.remarks, priceHidden: v.priceHidden, status, isFeatured: v.isFeatured,
  };
}

export type FieldErrors = Record<string, string>;

/** First message per field path, e.g. "itinerary.2.title". */
export function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".") || "_form";
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

export type SaveIntent = "draft" | "publish" | "keep";
export type SaveResult =
  | { ok: true; id: number; message: string; status: PackageRecord["status"] }
  | { ok: false; message: string; errors: FieldErrors };

// ---------- departures ----------

export interface DepartureFormState {
  date: string; departureCity: string; seatsTotal: string; seatsLeft: string; priceTwin: string; priceTriple: string;
  priceSingle: string; priceChildBed: string; priceChildNoBed: string; offerPriceTwin: string;
}

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date").refine((v) => isRealDate(v), "Enter a valid date");

export const departureSchema = z.object({
  date: isoDate,
  departureCity: z.string().trim().min(1, "Departure city is required").max(80),
  seatsTotal: int("Seats total", 0, 1000),
  seatsLeft: int("Seats left", 0, 1000),
  priceTwin: int("Twin price", 1, 100_000_000),
  priceTriple: optInt("Triple price"),
  priceSingle: optInt("Single price"),
  priceChildBed: optInt("Child with bed price"),
  priceChildNoBed: optInt("Child without bed price"),
  offerPriceTwin: optInt("Offer price"),
}).superRefine((v, ctx) => {
  if (v.seatsLeft > v.seatsTotal) ctx.addIssue({ code: "custom", path: ["seatsLeft"], message: "Seats left cannot exceed seats total" });
  if (v.offerPriceTwin !== null && v.offerPriceTwin >= v.priceTwin) ctx.addIssue({ code: "custom", path: ["offerPriceTwin"], message: "Offer price must be lower than the twin price" });
});

export type DepartureResult = { ok: true; message: string } | { ok: false; message: string; errors: FieldErrors };
