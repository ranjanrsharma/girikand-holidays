import type { IncludeKey } from "./config";

export type IncludeState = "yes" | "no" | "optional";
export type PackageStatus = "draft" | "published" | "archived";

export interface CityStop { name: string; nights: number }

export interface ItineraryDay {
  title: string;
  description: string;
  city?: string;
  distanceKm?: number | null;
  driveTime?: string | null;
  meals?: string[]; // subset of B, L, D
}

export interface CancellationSlab { fromDays: number; toDays: number; percent: number }
export interface PaymentRow { label: string; payment: string }
export interface PaymentSector { sector: string; rows: PaymentRow[] }

export interface PackageRecord {
  id: number;
  slug: string;
  code: string;
  title: string;
  category: string;
  type: "customized" | "group";
  badge: string | null;
  days: number;
  nights: number;
  overview: string;
  highlights: string[];
  heroImage: string | null;
  gallery: string[];
  region: "India" | "World";
  country: string;
  state: string | null;
  cities: CityStop[];
  tags: string[];
  includes: Partial<Record<IncludeKey, IncludeState>>;
  tourManager: boolean;
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  needToKnow: string[];
  cancellationSlabs: CancellationSlab[];
  cancellationNotes: string[];
  paymentTerms: PaymentSector[];
  remarks: string[];
  priceHidden: boolean;
  status: PackageStatus;
  isFeatured: boolean;
  minPrice: number | null;
  availableMonths: string[]; // YYYY-MM
  departureCities: string[];
  createdAt: string;
  updatedAt: string;
}

export type DepartureStatus = "open" | "few-left" | "sold-out";

export interface Departure {
  id: number;
  packageId: number;
  date: string; // YYYY-MM-DD
  departureCity: string;
  seatsTotal: number;
  seatsLeft: number;
  priceTwin: number;
  priceTriple: number | null;
  priceSingle: number | null;
  priceChildBed: number | null;
  priceChildNoBed: number | null;
  offerPriceTwin: number | null;
  status: DepartureStatus; // derived from seatsLeft
}

export interface PackageCard {
  id: number;
  slug: string;
  code: string;
  title: string;
  badge: string | null;
  days: number;
  nights: number;
  cityCount: number;
  stateCount: number;
  countryCount: number;
  includes: PackageRecord["includes"];
  heroImage: string | null;
  priceHidden: boolean;
  minPrice: number | null;
  emiPerMonth: number | null;
  departureCount: number;
}

export interface PackageDetail extends PackageRecord {
  departures: Departure[]; // upcoming only, sorted by date
}

export interface ListFilters {
  q?: string;
  state?: string;
  duration?: string; // bucket key
  budget?: string; // bucket key
  month?: string; // YYYY-MM
  departureCity?: string;
  tag?: string;
  sort?: string;
  page?: number;
}

export interface ListResult {
  items: PackageCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface FilterOptions {
  states: { value: string; count: number }[];
  durations: { key: string; label: string; count: number }[];
  budgets: { key: string; label: string; count: number }[];
  months: { value: string; label: string; count: number }[];
  departureCities: { value: string; count: number }[];
  tags: { value: string; count: number }[];
}

export type EnquiryKind = "enquiry" | "callback";
export type EnquiryStatus = "new" | "contacted" | "booked" | "lost";

export interface Enquiry {
  id: number;
  kind: EnquiryKind;
  packageId: number | null;
  packageTitle: string | null;
  name: string;
  phone: string;
  email: string | null;
  travelDate: string | null;
  adults: number | null;
  children: number | null;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
}

/** Fields the admin form submits for create and update. */
export type PackageInput = Omit<
  PackageRecord,
  "id" | "minPrice" | "availableMonths" | "departureCities" | "createdAt" | "updatedAt"
>;

export type DepartureInput = Omit<Departure, "id" | "status">;
