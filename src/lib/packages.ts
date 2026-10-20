import { BUDGET_BUCKETS, DURATION_BUCKETS, PAGE_SIZE } from "./config";
import { getDb, type Db } from "./db";
import { formatMonth, todayISO } from "./dates";
import { emiPerMonth } from "./money";
import type {
  Departure,
  DepartureInput,
  Enquiry,
  EnquiryKind,
  EnquiryStatus,
  FilterOptions,
  ListFilters,
  ListResult,
  PackageCard,
  PackageDetail,
  PackageInput,
  PackageRecord,
} from "./types";

const FEW_LEFT_AT = 5;

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const PACKAGE_COLS = `id, slug, code, title, category, type, badge, days, nights, overview, highlights, hero_image, gallery,
  region, country, state, cities, tags, includes, tour_manager, itinerary, inclusions, exclusions, need_to_know,
  cancellation_slabs, cancellation_notes, payment_terms, remarks, price_hidden, status, is_featured, min_price,
  available_months, departure_cities, to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
  to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at`;

const DEPARTURE_COLS = `id, package_id, to_char(date,'YYYY-MM-DD') AS date, departure_city, seats_total, seats_left,
  price_twin, price_triple, price_single, price_child_bed, price_child_nobed, offer_price_twin`;

function mapPackage(r: Row): PackageRecord {
  return {
    id: r.id, slug: r.slug, code: r.code, title: r.title, category: r.category, type: r.type, badge: r.badge,
    days: r.days, nights: r.nights, overview: r.overview, highlights: r.highlights, heroImage: r.hero_image,
    gallery: r.gallery, region: r.region, country: r.country, state: r.state, cities: r.cities, tags: r.tags,
    includes: r.includes, tourManager: r.tour_manager, itinerary: r.itinerary, inclusions: r.inclusions,
    exclusions: r.exclusions, needToKnow: r.need_to_know, cancellationSlabs: r.cancellation_slabs,
    cancellationNotes: r.cancellation_notes, paymentTerms: r.payment_terms, remarks: r.remarks,
    priceHidden: r.price_hidden, status: r.status, isFeatured: r.is_featured, minPrice: r.min_price,
    availableMonths: r.available_months, departureCities: r.departure_cities,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDeparture(r: Row): Departure {
  return {
    id: r.id, packageId: r.package_id, date: r.date, departureCity: r.departure_city,
    seatsTotal: r.seats_total, seatsLeft: r.seats_left, priceTwin: r.price_twin, priceTriple: r.price_triple,
    priceSingle: r.price_single, priceChildBed: r.price_child_bed, priceChildNoBed: r.price_child_nobed,
    offerPriceTwin: r.offer_price_twin,
    status: r.seats_left <= 0 ? "sold-out" : r.seats_left <= FEW_LEFT_AT ? "few-left" : "open",
  };
}

/** The price a visitor pays per person on twin sharing for a departure. */
export function effectivePrice(d: Pick<Departure, "priceTwin" | "offerPriceTwin">): number {
  return d.offerPriceTwin ?? d.priceTwin;
}

// ---------- public reads ----------

async function upcomingDepartures(packageIds?: number[]): Promise<Departure[]> {
  const db = await getDb();
  const rows = await db.query<Row>(
    `SELECT ${DEPARTURE_COLS} FROM departures WHERE date >= $1::date ORDER BY date, departure_city`,
    [todayISO()],
  );
  const all = rows.map(mapDeparture);
  return packageIds ? all.filter((d) => packageIds.includes(d.packageId)) : all;
}

interface Enriched {
  pkg: PackageRecord;
  departures: Departure[];
  minPrice: number | null;
  months: string[];
  cities: string[];
}

async function loadPublished(): Promise<Enriched[]> {
  const db = await getDb();
  const pkgs = (await db.query<Row>(`SELECT ${PACKAGE_COLS} FROM packages WHERE status = 'published'`)).map(mapPackage);
  const deps = await upcomingDepartures(pkgs.map((p) => p.id));
  return pkgs.map((pkg) => {
    const departures = deps.filter((d) => d.packageId === pkg.id);
    const bookable = departures.filter((d) => d.status !== "sold-out");
    const prices = bookable.map(effectivePrice);
    return {
      pkg,
      departures,
      minPrice: prices.length ? Math.min(...prices) : null,
      months: [...new Set(bookable.map((d) => d.date.slice(0, 7)))].sort(),
      cities: [...new Set(bookable.map((d) => d.departureCity))].sort(),
    };
  });
}

function toCard(e: Enriched): PackageCard {
  const p = e.pkg;
  const shownPrice = p.priceHidden ? null : e.minPrice;
  return {
    id: p.id, slug: p.slug, code: p.code, title: p.title, badge: p.badge, days: p.days, nights: p.nights,
    cityCount: p.cities.length, stateCount: p.state ? 1 : 0, countryCount: p.region === "World" ? 1 : 0,
    includes: p.includes, heroImage: p.heroImage, priceHidden: p.priceHidden,
    minPrice: shownPrice, emiPerMonth: shownPrice ? emiPerMonth(shownPrice) : null,
    departureCount: e.departures.length,
  };
}

export async function listPublished(filters: ListFilters = {}): Promise<ListResult> {
  const all = await loadPublished();
  const q = filters.q?.trim().toLowerCase();
  const dur = DURATION_BUCKETS.find((b) => b.key === filters.duration);
  const bud = BUDGET_BUCKETS.find((b) => b.key === filters.budget);

  let rows = all.filter(({ pkg, minPrice, months, cities }) => {
    if (q) {
      const hay = [pkg.title, pkg.code, pkg.state ?? "", pkg.country, ...pkg.cities.map((c) => c.name)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.state && pkg.state !== filters.state && pkg.country !== filters.state) return false;
    if (dur && (pkg.days < dur.min || pkg.days > dur.max)) return false;
    if (bud && (minPrice === null || pkg.priceHidden || minPrice < bud.min || minPrice >= bud.max)) return false;
    if (filters.month && !months.includes(filters.month)) return false;
    if (filters.departureCity && !cities.includes(filters.departureCity)) return false;
    if (filters.tag && !pkg.tags.includes(filters.tag)) return false;
    return true;
  });

  const price = (e: Enriched) => (e.pkg.priceHidden || e.minPrice === null ? Number.POSITIVE_INFINITY : e.minPrice);
  const sort = filters.sort ?? "deals";
  rows = [...rows].sort((a, b) => {
    if (sort === "price-asc") return price(a) - price(b);
    if (sort === "price-desc") return (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a));
    if (sort === "duration") return a.pkg.days - b.pkg.days || price(a) - price(b);
    return Number(b.pkg.isFeatured) - Number(a.pkg.isFeatured) || price(a) - price(b) || a.pkg.id - b.pkg.id;
  });

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  return {
    items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toCard),
    total, page, pageSize: PAGE_SIZE, pageCount,
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const all = await loadPublished();
  const count = <T,>(values: T[]) => {
    const m = new Map<T, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  };
  const sorted = <T extends { value: string }>(a: T[]) => a.sort((x, y) => x.value.localeCompare(y.value));
  return {
    states: sorted([...count(all.map((e) => e.pkg.state ?? e.pkg.country))].map(([value, c]) => ({ value, count: c }))),
    durations: DURATION_BUCKETS.map((b) => ({
      key: b.key, label: b.label, count: all.filter((e) => e.pkg.days >= b.min && e.pkg.days <= b.max).length,
    })),
    budgets: BUDGET_BUCKETS.map((b) => ({
      key: b.key, label: b.label,
      count: all.filter((e) => !e.pkg.priceHidden && e.minPrice !== null && e.minPrice >= b.min && e.minPrice < b.max).length,
    })),
    months: sorted([...count(all.flatMap((e) => e.months))].map(([value, c]) => ({ value, label: formatMonth(value), count: c }))),
    departureCities: sorted([...count(all.flatMap((e) => e.cities))].map(([value, c]) => ({ value, count: c }))),
    tags: sorted([...count(all.flatMap((e) => e.pkg.tags))].map(([value, c]) => ({ value, count: c }))),
  };
}

export async function getPublishedBySlug(slug: string): Promise<PackageDetail | null> {
  const db = await getDb();
  const rows = await db.query<Row>(`SELECT ${PACKAGE_COLS} FROM packages WHERE slug = $1 AND status = 'published'`, [slug]);
  if (!rows[0]) return null;
  const pkg = mapPackage(rows[0]);
  return { ...pkg, departures: await upcomingDepartures([pkg.id]) };
}

/** Slugs of published packages, for sitemaps and static params. */
export async function listPublishedSlugs(): Promise<string[]> {
  const db = await getDb();
  return (await db.query<Row>(`SELECT slug FROM packages WHERE status = 'published' ORDER BY id`)).map((r) => r.slug);
}

// ---------- admin ----------

export async function listAllPackages(): Promise<(PackageRecord & { departureCount: number; enquiryCount: number })[]> {
  const db = await getDb();
  const rows = await db.query<Row>(
    `SELECT ${PACKAGE_COLS},
       (SELECT count(*)::int FROM departures d WHERE d.package_id = packages.id) AS departure_count,
       (SELECT count(*)::int FROM enquiries e WHERE e.package_id = packages.id) AS enquiry_count
     FROM packages ORDER BY updated_at DESC, id DESC`,
  );
  return rows.map((r) => ({ ...mapPackage(r), departureCount: r.departure_count, enquiryCount: r.enquiry_count }));
}

export async function getPackageById(id: number): Promise<(PackageRecord & { departures: Departure[] }) | null> {
  const db = await getDb();
  const rows = await db.query<Row>(`SELECT ${PACKAGE_COLS} FROM packages WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  const deps = await db.query<Row>(`SELECT ${DEPARTURE_COLS} FROM departures WHERE package_id = $1 ORDER BY date, departure_city`, [id]);
  return { ...mapPackage(rows[0]), departures: deps.map(mapDeparture) };
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const J = (v: unknown) => JSON.stringify(v ?? null);

/** Insert (id null) or update. Returns the package id. Throws if slug or code is already used by another package. */
export async function savePackage(id: number | null, input: PackageInput, conn?: Db): Promise<number> {
  const db = conn ?? (await getDb());
  const clash = await db.query<Row>(`SELECT id FROM packages WHERE (slug = $1 OR code = $2) AND id <> $3`, [input.slug, input.code, id ?? 0]);
  if (clash.length) throw new Error("Another package already uses this slug or code.");

  const values = [
    input.slug, input.code, input.title, input.category, input.type, input.badge || null, input.days, input.nights,
    input.overview, J(input.highlights), input.heroImage || null, J(input.gallery), input.region, input.country,
    input.state || null, J(input.cities), J(input.tags), J(input.includes), input.tourManager, J(input.itinerary),
    J(input.inclusions), J(input.exclusions), J(input.needToKnow), J(input.cancellationSlabs),
    J(input.cancellationNotes), J(input.paymentTerms), J(input.remarks), input.priceHidden, input.status, input.isFeatured,
  ];
  const cols = [
    "slug", "code", "title", "category", "type", "badge", "days", "nights", "overview", "highlights", "hero_image", "gallery",
    "region", "country", "state", "cities", "tags", "includes", "tour_manager", "itinerary", "inclusions", "exclusions",
    "need_to_know", "cancellation_slabs", "cancellation_notes", "payment_terms", "remarks", "price_hidden", "status", "is_featured",
  ];
  const jsonCols = new Set(["highlights", "gallery", "cities", "tags", "includes", "itinerary", "inclusions", "exclusions",
    "need_to_know", "cancellation_slabs", "cancellation_notes", "payment_terms", "remarks"]);
  const ph = cols.map((c, i) => `$${i + 1}${jsonCols.has(c) ? "::jsonb" : ""}`);

  if (id === null) {
    const r = await db.query<Row>(`INSERT INTO packages (${cols.join(", ")}) VALUES (${ph.join(", ")}) RETURNING id`, values);
    return r[0].id;
  }
  await db.query(
    `UPDATE packages SET ${cols.map((c, i) => `${c} = ${ph[i]}`).join(", ")}, updated_at = now() WHERE id = $${cols.length + 1}`,
    [...values, id],
  );
  return id;
}

export async function setPackageStatus(id: number, status: PackageRecord["status"]): Promise<void> {
  const db = await getDb();
  await db.query(`UPDATE packages SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
}

export async function deletePackage(id: number): Promise<void> {
  const db = await getDb();
  await db.query(`DELETE FROM packages WHERE id = $1`, [id]);
}

/** Recomputes the stored summary columns (lowest price, months, departure cities) shown in the admin. */
export async function refreshSummary(packageId: number, conn?: Db): Promise<void> {
  const db = conn ?? (await getDb());
  await db.query(
    `UPDATE packages SET
       min_price = (SELECT min(COALESCE(offer_price_twin, price_twin)) FROM departures WHERE package_id = $1 AND date >= $2::date AND seats_left > 0),
       available_months = COALESCE((SELECT jsonb_agg(m ORDER BY m) FROM (SELECT DISTINCT to_char(date,'YYYY-MM') AS m FROM departures WHERE package_id = $1 AND date >= $2::date AND seats_left > 0) x), '[]'::jsonb),
       departure_cities = COALESCE((SELECT jsonb_agg(c ORDER BY c) FROM (SELECT DISTINCT departure_city AS c FROM departures WHERE package_id = $1 AND date >= $2::date AND seats_left > 0) y), '[]'::jsonb)
     WHERE id = $1`,
    [packageId, todayISO()],
  );
}

/** Insert (id null) or update a departure. Throws if the package already has that date and city. */
export async function saveDeparture(id: number | null, input: DepartureInput, conn?: Db): Promise<number> {
  const db = conn ?? (await getDb());
  const clash = await db.query<Row>(
    `SELECT id FROM departures WHERE package_id = $1 AND date = $2::date AND departure_city = $3 AND id <> $4`,
    [input.packageId, input.date, input.departureCity, id ?? 0],
  );
  if (clash.length) throw new Error("This package already has a departure on that date from that city.");
  const v = [input.packageId, input.date, input.departureCity, input.seatsTotal, input.seatsLeft, input.priceTwin,
    input.priceTriple, input.priceSingle, input.priceChildBed, input.priceChildNoBed, input.offerPriceTwin];
  let out: number;
  if (id === null) {
    const r = await db.query<Row>(
      `INSERT INTO departures (package_id, date, departure_city, seats_total, seats_left, price_twin, price_triple, price_single,
        price_child_bed, price_child_nobed, offer_price_twin) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`, v);
    out = r[0].id;
  } else {
    await db.query(
      `UPDATE departures SET package_id = $1, date = $2::date, departure_city = $3, seats_total = $4, seats_left = $5, price_twin = $6,
        price_triple = $7, price_single = $8, price_child_bed = $9, price_child_nobed = $10, offer_price_twin = $11 WHERE id = $12`,
      [...v, id]);
    out = id;
  }
  await refreshSummary(input.packageId, db);
  return out;
}

export async function deleteDeparture(id: number): Promise<void> {
  const db = await getDb();
  const r = await db.query<Row>(`DELETE FROM departures WHERE id = $1 RETURNING package_id`, [id]);
  if (r[0]) await refreshSummary(r[0].package_id);
}

// ---------- enquiries ----------

export interface NewEnquiry {
  kind: EnquiryKind;
  packageId?: number | null;
  name: string;
  phone: string;
  email?: string | null;
  travelDate?: string | null;
  adults?: number | null;
  children?: number | null;
  message?: string | null;
}

export async function createEnquiry(e: NewEnquiry): Promise<number> {
  const db = await getDb();
  const r = await db.query<Row>(
    `INSERT INTO enquiries (kind, package_id, name, phone, email, travel_date, adults, children, message)
     VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9) RETURNING id`,
    [e.kind, e.packageId ?? null, e.name, e.phone, e.email || null, e.travelDate || null, e.adults ?? null, e.children ?? null, e.message || null],
  );
  return r[0].id;
}

export async function listEnquiries(opts: { status?: EnquiryStatus; kind?: EnquiryKind } = {}): Promise<Enquiry[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) { params.push(opts.status); where.push(`e.status = $${params.length}`); }
  if (opts.kind) { params.push(opts.kind); where.push(`e.kind = $${params.length}`); }
  const rows = await db.query<Row>(
    `SELECT e.id, e.kind, e.package_id, p.title AS package_title, e.name, e.phone, e.email,
       to_char(e.travel_date,'YYYY-MM-DD') AS travel_date, e.adults, e.children, e.message, e.status,
       to_char(e.created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
     FROM enquiries e LEFT JOIN packages p ON p.id = e.package_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY e.created_at DESC, e.id DESC`,
    params,
  );
  return rows.map((r) => ({
    id: r.id, kind: r.kind, packageId: r.package_id, packageTitle: r.package_title, name: r.name, phone: r.phone,
    email: r.email, travelDate: r.travel_date, adults: r.adults, children: r.children, message: r.message,
    status: r.status, createdAt: r.created_at,
  }));
}

export async function setEnquiryStatus(id: number, status: EnquiryStatus): Promise<void> {
  const db = await getDb();
  await db.query(`UPDATE enquiries SET status = $1 WHERE id = $2`, [status, id]);
}

export async function countNewEnquiries(): Promise<number> {
  const db = await getDb();
  return (await db.query<Row>(`SELECT count(*)::int AS n FROM enquiries WHERE status = 'new'`))[0].n;
}
