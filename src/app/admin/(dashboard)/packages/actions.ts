"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { addDays, todayISO } from "@/lib/dates";
import { deleteDeparture, getPackageById, saveDeparture, savePackage } from "@/lib/packages";
import {
  departureSchema, issuesToErrors, packageSchema, publishMessage, publishProblems, toPackageInput,
  type DepartureFormState, type DepartureResult, type PackageFormState, type SaveIntent, type SaveResult,
} from "@/components/admin/schema";

function refresh(id: number, slug?: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/packages/${id}`);
  if (slug) revalidatePath(`/package/${slug}`);
  revalidatePath("/");
}

export async function savePackageAction(id: number | null, intent: SaveIntent, form: PackageFormState): Promise<SaveResult> {
  await requireAdmin();
  if (id !== null && !Number.isInteger(id)) return { ok: false, message: "Unknown package.", errors: {} };
  const parsed = packageSchema.safeParse(form);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: issuesToErrors(parsed.error.issues) };
  }
  const v = parsed.data;
  const existing = id === null ? null : await getPackageById(id);
  if (id !== null && !existing) return { ok: false, message: "This package no longer exists.", errors: {} };

  const status = intent === "draft" ? "draft" : intent === "publish" ? "published" : (existing?.status ?? "draft");
  if (status === "published") {
    const problems = publishProblems({
      days: v.days, itinerary: v.itinerary, heroImage: v.heroImage || null,
      publishWithoutPhoto: v.publishWithoutPhoto, departures: existing?.departures ?? [],
    });
    if (problems.length) {
      const message = publishMessage(problems);
      return { ok: false, message, errors: { _form: message } };
    }
  }
  try {
    const savedId = await savePackage(id, toPackageInput(v, status));
    refresh(savedId, v.slug);
    if (existing && existing.slug !== v.slug) revalidatePath(`/package/${existing.slug}`);
    return { ok: true, id: savedId, status, message: status === "published" ? "Saved and published." : "Saved as draft." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save the package.";
    return { ok: false, message, errors: { _form: message, slug: "Check that the slug is unique", code: "Check that the code is unique" } };
  }
}

function departureInput(packageId: number, f: DepartureFormState) {
  const r = departureSchema.safeParse(f);
  if (!r.success) return { ok: false, errors: issuesToErrors(r.error.issues) } as const;
  const v = r.data;
  return { ok: true, data: { packageId, ...v } } as const;
}

export async function saveDepartureAction(packageId: number, departureId: number | null, f: DepartureFormState): Promise<DepartureResult> {
  await requireAdmin();
  const pkg = Number.isInteger(packageId) ? await getPackageById(packageId) : null;
  if (!pkg) return { ok: false, message: "This package no longer exists.", errors: {} };
  const r = departureInput(packageId, f);
  if (!r.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: r.errors };
  if (departureId === null && r.data.date < todayISO()) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: { date: "A new departure cannot be in the past" } };
  }
  try {
    await saveDeparture(departureId, r.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save the departure.";
    return { ok: false, message, errors: { _form: message } };
  }
  refresh(packageId, pkg.slug);
  return { ok: true, message: departureId === null ? "Departure added." : "Departure updated." };
}

export async function deleteDepartureAction(packageId: number, departureId: number): Promise<DepartureResult> {
  await requireAdmin();
  const pkg = await getPackageById(packageId);
  const owned = pkg?.departures.some((d) => d.id === departureId);
  if (!pkg || !owned) return { ok: false, message: "That departure no longer exists.", errors: {} };
  await deleteDeparture(departureId);
  refresh(packageId, pkg.slug);
  return { ok: true, message: "Departure deleted." };
}

export interface BulkForm extends DepartureFormState { fromDate: string; toDate: string; weekdays: number[] }

export async function bulkAddDeparturesAction(packageId: number, f: BulkForm): Promise<DepartureResult> {
  await requireAdmin();
  const pkg = Number.isInteger(packageId) ? await getPackageById(packageId) : null;
  if (!pkg) return { ok: false, message: "This package no longer exists.", errors: {} };
  const errors: Record<string, string> = {};
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(f.fromDate)) errors.fromDate = "Enter a start date";
  if (!iso.test(f.toDate)) errors.toDate = "Enter an end date";
  if (!errors.fromDate && !errors.toDate) {
    if (f.toDate < f.fromDate) errors.toDate = "End date must be on or after the start date";
    else if (f.toDate > addDays(f.fromDate, 366)) errors.toDate = "Choose a range of at most one year";
  }
  const days = Array.isArray(f.weekdays) ? f.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
  if (days.length === 0) errors.weekdays = "Choose at least one weekday";
  const base = departureSchema.safeParse({ ...f, date: iso.test(f.fromDate) ? f.fromDate : "" });
  if (!base.success) Object.assign(errors, Object.fromEntries(Object.entries(issuesToErrors(base.error.issues)).filter(([k]) => k !== "date")));
  if (Object.keys(errors).length || !base.success) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const today = todayISO();
  let created = 0;
  let skipped = 0;
  for (let d = f.fromDate; d <= f.toDate; d = addDays(d, 1)) {
    if (!days.includes(new Date(d + "T00:00:00Z").getUTCDay())) continue;
    if (d < today) { skipped++; continue; }
    try {
      await saveDeparture(null, { packageId, ...base.data, date: d });
      created++;
    } catch {
      skipped++; // already exists for that date and city
    }
  }
  refresh(packageId, pkg.slug);
  if (created === 0) return { ok: false, message: `No departures created (${skipped} skipped: past dates or already existing).`, errors: {} };
  return { ok: true, message: `Created ${created} departure${created === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} (past or already existing)` : ""}.` };
}
