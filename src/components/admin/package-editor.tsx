"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { savePackageAction } from "@/app/admin/(dashboard)/packages/actions";
import { computeSlabs, DEFAULT_PAYMENT_TERMS, DEFAULT_SLABS } from "@/lib/cancellation";
import { INCLUDE_KEYS, MEAL_CODES, TAG_OPTIONS } from "@/lib/config";
import { addDays, formatDateShort, todayISO } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { slugify } from "./slug";
import type { Departure, PackageStatus } from "@/lib/types";
import { DeparturesPanel } from "./departures-panel";
import { Check, Field, LinesEditor, SelectInput, TextArea, TextInput } from "./fields";
import { slabsToForm, validateSlabs, type FieldErrors, type PackageFormState, type SaveIntent } from "./schema";
import { btnPrimary, btnSecondary, btnSmall, card, inputCls, td, th } from "./ui";

const TABS = [
  { id: "basics", label: "Basics", keys: ["title", "slug", "code", "badge", "category", "type", "days", "nights", "region", "country", "state", "cities", "tags", "overview", "highlights", "isFeatured", "priceHidden"] },
  { id: "includes", label: "Includes", keys: ["includes", "tourManager"] },
  { id: "itinerary", label: "Itinerary", keys: ["itinerary"] },
  { id: "lists", label: "Inclusions and exclusions", keys: ["inclusions", "exclusions", "needToKnow", "remarks"] },
  { id: "policies", label: "Policies", keys: ["cancellationSlabs", "cancellationNotes", "paymentTerms"] },
  { id: "media", label: "Media", keys: ["heroImage", "gallery"] },
  { id: "departures", label: "Departures", keys: [] },
] as const;
type TabId = (typeof TABS)[number]["id"];

const INCLUDE_LABEL: Record<string, string> = { hotel: "Hotel", meals: "Meals", flight: "Flight", sightseeing: "Sightseeing", transport: "Transport", visa: "Visa" };
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

interface Props {
  packageId: number | null;
  initial: PackageFormState;
  status: PackageStatus;
  departures: Departure[];
  slugLocked: boolean;
  banner?: string;
}

export function PackageEditor({ packageId, initial, status, departures, slugLocked, banner }: Props) {
  const router = useRouter();
  const [f, setF] = useState<PackageFormState>(initial);
  const [tab, setTab] = useState<TabId>("basics");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(banner ?? "");
  const [slugTouched, setSlugTouched] = useState(slugLocked);
  const [pending, start] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof PackageFormState>(k: K, v: PackageFormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const showToast = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  };
  useEffect(() => {
    if (banner) showToast(banner);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errCount = (keys: readonly string[]) =>
    Object.keys(errors).filter((k) => keys.some((p) => k === p || k.startsWith(p + "."))).length;

  function submit(intent: SaveIntent) {
    setFormError("");
    start(async () => {
      const r = await savePackageAction(packageId, intent, f);
      if (r.ok) {
        setErrors({});
        showToast(r.message);
        if (packageId === null) router.replace(`/admin/packages/${r.id}?created=1`);
        else router.refresh();
      } else {
        setErrors(r.errors);
        setFormError(r.message);
        const first = TABS.find((t) => Object.keys(r.errors).some((k) => t.keys.some((p) => k === p || k.startsWith(p + "."))));
        if (first) setTab(first.id);
      }
    });
  }

  const e = (k: string) => errors[k];
  const previewHref = f.slug ? `/package/${f.slug}` : null;
  const isPublished = status === "published";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{packageId === null ? "New package" : (f.title || "Edit package")}</h1>
          <p className="text-sm text-ink-500">
            {packageId === null ? "Draft, not saved yet" : <>Status: <span className="font-semibold capitalize">{status}</span></>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex gap-3">
            <Link href="/admin" className="text-accent underline">Back to packages</Link>
            {previewHref && packageId !== null && (
              <a href={previewHref} target="_blank" rel="noopener" className="text-accent underline">Preview</a>
            )}
          </div>
          {packageId !== null && !isPublished && <p className="text-xs text-ink-500">Draft and archived packages show a 404 on the public page.</p>}
        </div>
      </div>

      <div aria-live="polite" className="fixed bottom-20 right-4 z-30 max-w-sm">
        {toast && <p role="status" className="rounded-md border border-good bg-white px-4 py-3 text-sm font-medium text-good shadow-lg">{toast}</p>}
      </div>
      <div aria-live="assertive">
        {formError && <p role="alert" className="rounded-md border border-bad bg-bad/10 px-3 py-2 text-sm text-bad">{formError}</p>}
      </div>

      <div role="tablist" aria-label="Package sections" className="flex gap-1 overflow-x-auto border-b border-ink-200">
        {TABS.map((t) => {
          const n = errCount(t.keys);
          const active = tab === t.id;
          return (
            <button
              key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={active} aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-accent text-accent" : "border-transparent text-ink-500 hover:text-ink-900"}`}
            >
              {t.label}
              {n > 0 && <span className="ml-1 rounded-full bg-bad px-1.5 text-xs text-white" aria-label={`${n} errors`}>{n}</span>}
            </button>
          );
        })}
      </div>

      {tab === "departures" && (
        <div role="tabpanel" id="panel-departures" aria-labelledby="tab-departures" className={card}>
          {packageId === null ? (
            <p className="text-sm text-ink-700">Save the package first. Departures can be added once the package exists.</p>
          ) : (
            <DeparturesPanel packageId={packageId} departures={departures} />
          )}
        </div>
      )}

      {tab !== "departures" && (
      <form
        noValidate
        onSubmit={(ev) => { ev.preventDefault(); submit(isPublished ? "keep" : "draft"); }}
        aria-label="Package editor"
      >
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={card}>
          {tab === "basics" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput id="title" label="Title" value={f.title} error={e("title")} className="sm:col-span-2"
                onChange={(v) => setF((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v) }))} />
              <TextInput id="slug" label="Slug (web address)" value={f.slug} error={e("slug")} hint="Used in /package/your-slug. Generated from the title until you edit it."
                onChange={(v) => { setSlugTouched(true); set("slug", v); }} />
              <TextInput id="code" label="Code" value={f.code} error={e("code")} placeholder="GHGA1" onChange={(v) => set("code", v.toUpperCase())} />
              <TextInput id="badge" label="Badge text" value={f.badge} error={e("badge")} placeholder="Customized Holiday" onChange={(v) => set("badge", v)} />
              <Field id="category" label="Category" error={e("category")}>
                <input id="category" name="category" list="category-list" value={f.category} onChange={(ev) => set("category", ev.target.value)} className={inputCls} />
                <datalist id="category-list"><option value="family" /><option value="honeymoon" /><option value="adventure" /><option value="pilgrimage" /><option value="group" /></datalist>
              </Field>
              <SelectInput id="type" label="Type" value={f.type} error={e("type")} onChange={(v) => set("type", v as "customized" | "group")}
                options={[{ value: "customized", label: "Customized" }, { value: "group", label: "Group" }]} />
              <TextInput id="days" label="Days" type="number" min={1} max={60} value={f.days} error={e("days")} onChange={(v) => set("days", v)} />
              <TextInput id="nights" label="Nights" type="number" min={0} max={60} value={f.nights} error={e("nights")} onChange={(v) => set("nights", v)} />
              <SelectInput id="region" label="Region" value={f.region} error={e("region")} onChange={(v) => set("region", v as "India" | "World")}
                options={[{ value: "India", label: "India" }, { value: "World", label: "World" }]} />
              <TextInput id="country" label="Country" value={f.country} error={e("country")} onChange={(v) => set("country", v)} />
              <TextInput id="state" label="State" value={f.state} error={e("state")} hint="Leave empty for overseas packages." onChange={(v) => set("state", v)} />

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="mb-1 text-sm font-medium">Cities</legend>
                {f.cities.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-start gap-2">
                    <input aria-label={`City ${i + 1} name`} value={c.name} placeholder="City" className={`${inputCls} min-w-40 flex-1`}
                      onChange={(ev) => set("cities", f.cities.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))} />
                    <input aria-label={`City ${i + 1} nights`} type="number" min={0} value={c.nights} placeholder="Nights" className={`${inputCls} !w-24`}
                      onChange={(ev) => set("cities", f.cities.map((x, j) => (j === i ? { ...x, nights: ev.target.value } : x)))} />
                    <button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Remove city ${i + 1}`} onClick={() => set("cities", f.cities.filter((_, j) => j !== i))}>Remove</button>
                    <div aria-live="polite" className="w-full text-xs text-bad">{e(`cities.${i}.nights`)}</div>
                  </div>
                ))}
                <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => set("cities", [...f.cities, { name: "", nights: "" }])}>Add city</button>
              </fieldset>

              <fieldset className="sm:col-span-2">
                <legend className="mb-1 text-sm font-medium">Tags</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {TAG_OPTIONS.map((t) => (
                    <Check key={t} id={`tag-${slugify(t)}`} label={t} checked={f.tags.includes(t)}
                      onChange={(on) => set("tags", on ? [...f.tags, t] : f.tags.filter((x) => x !== t))} />
                  ))}
                </div>
                <CustomTags tags={f.tags} onChange={(v) => set("tags", v)} />
              </fieldset>

              <TextArea id="overview" label="Overview" rows={5} value={f.overview} error={e("overview")} className="sm:col-span-2" onChange={(v) => set("overview", v)} />
              <div className="sm:col-span-2">
                <LinesEditor id="highlights" label="Highlights" values={f.highlights} errors={errors} addLabel="Add highlight" onChange={(v) => set("highlights", v)} />
              </div>
              <Check id="isFeatured" label="Featured on the home page" checked={f.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <Check id="priceHidden" label="Hide price" hint="Visitors see 'Ask for price' instead of a figure." checked={f.priceHidden} onChange={(v) => set("priceHidden", v)} />
            </div>
          )}

          {tab === "includes" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {INCLUDE_KEYS.map((k) => (
                  <SelectInput key={k} id={`include-${k}`} label={INCLUDE_LABEL[k]} value={f.includes[k]}
                    onChange={(v) => set("includes", { ...f.includes, [k]: v as "yes" | "no" | "optional" })}
                    options={[{ value: "yes", label: "Yes, included" }, { value: "no", label: "No" }, { value: "optional", label: "Optional" }]} />
                ))}
              </div>
              <Check id="tourManager" label="Tour manager accompanies the group" checked={f.tourManager} onChange={(v) => set("tourManager", v)} />
            </div>
          )}

          {tab === "itinerary" && <ItineraryTab f={f} set={set} errors={errors} />}

          {tab === "lists" && (
            <div className="grid gap-6 md:grid-cols-2">
              <LinesEditor id="inclusions" label="Inclusions" values={f.inclusions} multiline addLabel="Add inclusion" onChange={(v) => set("inclusions", v)} />
              <LinesEditor id="exclusions" label="Exclusions" values={f.exclusions} multiline addLabel="Add exclusion" onChange={(v) => set("exclusions", v)} />
              <LinesEditor id="needToKnow" label="Need to know" values={f.needToKnow} multiline addLabel="Add note" onChange={(v) => set("needToKnow", v)} />
              <LinesEditor id="remarks" label="Remarks" values={f.remarks} multiline addLabel="Add remark" onChange={(v) => set("remarks", v)} />
            </div>
          )}

          {tab === "policies" && <PoliciesTab f={f} set={set} errors={errors} />}

          {tab === "media" && <MediaTab f={f} set={set} errors={errors} />}

        </div>

        {(
          <div className="sticky bottom-0 -mx-4 mt-4 flex flex-wrap items-center gap-2 border-t border-ink-200 bg-white px-4 py-3">
            {isPublished ? (
              <>
                <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Saving..." : "Save changes"}</button>
                <button type="button" disabled={pending} className={btnSecondary} onClick={() => submit("draft")}>Unpublish and save as draft</button>
              </>
            ) : (
              <>
                <button type="submit" disabled={pending} className={btnSecondary}>{pending ? "Saving..." : "Save draft"}</button>
                <button type="button" disabled={pending} className={btnPrimary} onClick={() => submit("publish")}>Save and publish</button>
              </>
            )}
            <span className="text-xs text-ink-500">Publishing needs an upcoming priced departure, a hero image (or the 'publish without photo' tick on the Media tab) and an itinerary entry for every day.</span>
          </div>
        )}
      </form>
      )}
    </div>
  );
}

type TabProps = { f: PackageFormState; set: <K extends keyof PackageFormState>(k: K, v: PackageFormState[K]) => void; errors: FieldErrors };

function CustomTags({ tags, onChange }: { tags: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState("");
  const custom = tags.filter((t) => !TAG_OPTIONS.includes(t));
  const add = () => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setV("");
  };
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <input aria-label="Custom tag" value={v} placeholder="Custom tag" className={`${inputCls} !w-56`} onChange={(ev) => setV(ev.target.value)}
          onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); add(); } }} />
        <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={add}>Add tag</button>
      </div>
      {custom.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {custom.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
              {t}
              <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="font-bold">x</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItineraryTab({ f, set, errors }: TabProps) {
  const days = f.itinerary;
  const update = (i: number, patch: Partial<PackageFormState["itinerary"][number]>) =>
    set("itinerary", days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    const next = [...days];
    [next[i], next[j]] = [next[j], next[i]];
    set("itinerary", next);
  };
  const target = Number(f.days);
  const blank = () => ({ title: "", description: "", city: "", distanceKm: "", driveTime: "", meals: [] as string[] });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnSecondary} disabled={!Number.isInteger(target) || target < 1 || target > 60}
          onClick={() => set("itinerary", [...days, ...Array.from({ length: Math.max(0, target - days.length) }, blank)])}>
          Generate {Number.isInteger(target) && target > 0 ? target : "N"} empty days
        </button>
        <button type="button" className={btnSecondary} onClick={() => set("itinerary", [...days, blank()])}>Add a day</button>
        <p className="text-sm text-ink-500">{days.length} of {f.days || "?"} days written.</p>
      </div>
      <div aria-live="polite">{errors.itinerary && <p className="text-sm text-bad">{errors.itinerary}</p>}</div>
      {days.length === 0 && <p className="text-sm text-ink-500">No days yet. Add a day or generate empty days from the days field.</p>}
      <ol className="space-y-4">
        {days.map((d, i) => (
          <li key={i} className="rounded-md border border-ink-200 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Day {i + 1}</h3>
              <div className="flex gap-1">
                <button type="button" className={`${btnSecondary} ${btnSmall}`} disabled={i === 0} aria-label={`Move day ${i + 1} up`} onClick={() => move(i, -1)}>Move up</button>
                <button type="button" className={`${btnSecondary} ${btnSmall}`} disabled={i === days.length - 1} aria-label={`Move day ${i + 1} down`} onClick={() => move(i, 1)}>Move down</button>
                <button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Remove day ${i + 1}`} onClick={() => set("itinerary", days.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <TextInput id={`day-${i}-title`} label={`Day ${i + 1} title`} value={d.title} error={errors[`itinerary.${i}.title`]} className="sm:col-span-4" onChange={(v) => update(i, { title: v })} />
              <TextArea id={`day-${i}-description`} label={`Day ${i + 1} description`} rows={3} value={d.description} error={errors[`itinerary.${i}.description`]} className="sm:col-span-4" onChange={(v) => update(i, { description: v })} />
              <TextInput id={`day-${i}-city`} label="City" value={d.city} onChange={(v) => update(i, { city: v })} />
              <TextInput id={`day-${i}-distance`} label="Distance (km)" type="number" min={0} value={d.distanceKm} error={errors[`itinerary.${i}.distanceKm`]} onChange={(v) => update(i, { distanceKm: v })} />
              <TextInput id={`day-${i}-drive`} label="Drive time" placeholder="1 hr 15 min" value={d.driveTime} onChange={(v) => update(i, { driveTime: v })} />
              <fieldset>
                <legend className="mb-1 text-sm font-medium">Meals</legend>
                <div className="flex gap-3 pt-1">
                  {MEAL_CODES.map((m) => (
                    <Check key={m} id={`day-${i}-meal-${m}`} label={m} checked={d.meals.includes(m)}
                      onChange={(on) => update(i, { meals: on ? [...d.meals, m] : d.meals.filter((x) => x !== m) })} />
                  ))}
                </div>
              </fieldset>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PoliciesTab({ f, set, errors }: TabProps) {
  const slabs = f.cancellationSlabs;
  const upd = (i: number, patch: Partial<(typeof slabs)[number]>) => set("cancellationSlabs", slabs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const parsed = slabs.map((s) => ({ fromDays: num(s.fromDays), toDays: num(s.toDays), percent: num(s.percent) }));
  const live = validateSlabs(parsed);
  const message = errors.cancellationSlabs ?? live;
  const sampleDate = useMemo(() => addDays(todayISO(), 60), []);
  const preview = live === null ? computeSlabs(parsed, sampleDate, 16000) : null;

  const terms = f.paymentTerms;
  const updTerm = (i: number, patch: Partial<(typeof terms)[number]>) => set("paymentTerms", terms.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <div className="space-y-8">
      <section aria-labelledby="slabs-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="slabs-h" className="text-lg font-semibold">Cancellation slabs</h2>
          <button type="button" className={btnSecondary} onClick={() => set("cancellationSlabs", slabsToForm(DEFAULT_SLABS))}>Reset to default</button>
        </div>
        <p className="text-sm text-ink-500">Days before departure. Slabs must start at 0 and run without gaps or overlaps.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <caption className="sr-only">Cancellation slabs</caption>
            <thead><tr><th scope="col" className={th}>From days</th><th scope="col" className={th}>To days</th><th scope="col" className={th}>Percent</th><th scope="col" className={th}><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {slabs.map((s, i) => (
                <tr key={i}>
                  {(["fromDays", "toDays", "percent"] as const).map((k) => (
                    <td key={k} className={td}>
                      <input type="number" min={0} max={k === "percent" ? 100 : undefined} aria-label={`Slab ${i + 1} ${k === "fromDays" ? "from days" : k === "toDays" ? "to days" : "percent"}`}
                        value={s[k]} onChange={(ev) => upd(i, { [k]: ev.target.value })} className={`${inputCls} !w-28`} />
                    </td>
                  ))}
                  <td className={td}><button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Remove slab ${i + 1}`} onClick={() => set("cancellationSlabs", slabs.filter((_, j) => j !== i))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => set("cancellationSlabs", [...slabs, { fromDays: "", toDays: "", percent: "" }])}>Add slab</button>
        <div aria-live="polite">{message && <p role="alert" id="slab-error" className="text-sm text-bad">{message}</p>}</div>

        <div className="rounded-md bg-ink-50 p-3">
          <h3 className="mb-2 text-sm font-semibold">Preview: {formatINR(16000)} per person, departing {formatDateShort(sampleDate)}</h3>
          {preview ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead><tr><th scope="col" className={th}>Cancel between</th><th scope="col" className={th}>Charge</th><th scope="col" className={th}>Amount</th></tr></thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={p.fromDays}>
                      <td className={td}>{formatDateShort(p.startDate)} to {formatDateShort(p.endDate)}</td>
                      <td className={td}>{p.percent}%</td>
                      <td className={td}>{formatINR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-ink-500">Fix the slabs above to see the preview.</p>}
        </div>
      </section>

      <LinesEditor id="cancellationNotes" label="Cancellation notes" values={f.cancellationNotes} multiline addLabel="Add note" onChange={(v) => set("cancellationNotes", v)} />

      <section aria-labelledby="pay-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="pay-h" className="text-lg font-semibold">Payment terms</h2>
          <button type="button" className={btnSecondary} onClick={() => set("paymentTerms", structuredClone(DEFAULT_PAYMENT_TERMS))}>Reset to default</button>
        </div>
        {terms.map((t, i) => (
          <div key={i} className="space-y-2 rounded-md border border-ink-200 p-3">
            <div className="flex items-end gap-2">
              <TextInput id={`sector-${i}`} label={`Sector ${i + 1}`} value={t.sector} className="flex-1" onChange={(v) => updTerm(i, { sector: v })} />
              <button type="button" className={`${btnSecondary} ${btnSmall} mb-1`} aria-label={`Remove sector ${i + 1}`} onClick={() => set("paymentTerms", terms.filter((_, j) => j !== i))}>Remove sector</button>
            </div>
            {t.rows.map((r, ri) => (
              <div key={ri} className="flex flex-wrap items-start gap-2">
                <input aria-label={`Sector ${i + 1} row ${ri + 1} label`} value={r.label} placeholder="When" className={`${inputCls} min-w-48 flex-1`}
                  onChange={(ev) => updTerm(i, { rows: t.rows.map((x, j) => (j === ri ? { ...x, label: ev.target.value } : x)) })} />
                <input aria-label={`Sector ${i + 1} row ${ri + 1} payment`} value={r.payment} placeholder="Payment" className={`${inputCls} min-w-48 flex-1`}
                  onChange={(ev) => updTerm(i, { rows: t.rows.map((x, j) => (j === ri ? { ...x, payment: ev.target.value } : x)) })} />
                <button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Remove sector ${i + 1} row ${ri + 1}`} onClick={() => updTerm(i, { rows: t.rows.filter((_, j) => j !== ri) })}>Remove</button>
              </div>
            ))}
            <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => updTerm(i, { rows: [...t.rows, { label: "", payment: "" }] })}>Add row</button>
          </div>
        ))}
        <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => set("paymentTerms", [...terms, { sector: "", rows: [{ label: "", payment: "" }] }])}>Add sector</button>
      </section>
    </div>
  );
}

function Preview({ url, alt }: { url: string; alt: string }) {
  const [bad, setBad] = useState(false);
  const ok = /^https?:\/\/\S+$/i.test(url) || /^\/\S+$/.test(url);
  if (!url || !ok) return <div className="flex h-28 items-center justify-center rounded-md bg-ink-100 text-xs text-ink-500">No preview</div>;
  if (bad) return <div className="flex h-28 items-center justify-center rounded-md bg-ink-100 text-xs text-bad">Image could not be loaded</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} onError={() => setBad(true)} className="h-28 w-full rounded-md object-cover" />;
}

function MediaTab({ f, set, errors }: TabProps) {
  const gallery = f.gallery;
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">Paste image web addresses for now. File uploads will come later.</p>
      <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
        <TextInput id="heroImage" label="Hero image URL" value={f.heroImage} error={errors.heroImage} placeholder="https://..." onChange={(v) => set("heroImage", v)} />
        <Preview key={f.heroImage} url={f.heroImage} alt="Hero preview" />
      </div>
      <Check id="publishWithoutPhoto" label="Publish without photo" hint="Tick to allow publishing while there is no hero image (a placeholder is shown)." checked={f.publishWithoutPhoto} onChange={(v) => set("publishWithoutPhoto", v)} />
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Gallery image URLs</legend>
        {gallery.map((g, i) => (
          <div key={i} className="grid items-start gap-2 sm:grid-cols-[1fr_auto_10rem]">
            <div>
              <input aria-label={`Gallery image ${i + 1} URL`} value={g} placeholder="https://..." className={inputCls}
                onChange={(ev) => set("gallery", gallery.map((x, j) => (j === i ? ev.target.value : x)))} />
              <div aria-live="polite">{errors[`gallery.${i}`] && <p className="mt-1 text-xs text-bad">{errors[`gallery.${i}`]}</p>}</div>
            </div>
            <button type="button" className={`${btnSecondary} ${btnSmall}`} aria-label={`Remove gallery image ${i + 1}`} onClick={() => set("gallery", gallery.filter((_, j) => j !== i))}>Remove</button>
            <Preview key={g} url={g} alt={`Gallery preview ${i + 1}`} />
          </div>
        ))}
        <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => set("gallery", [...gallery, ""])}>Add gallery image</button>
      </fieldset>
    </div>
  );
}
