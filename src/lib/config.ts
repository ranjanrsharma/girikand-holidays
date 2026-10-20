export const BRAND = {
  name: "Girikand Holidays",
  tagline: "Customized family holidays",
  phone: "1800 000 0000",
  phoneHref: "tel:18000000000",
  enquiryEmail: process.env.ENQUIRY_EMAIL ?? "enquiries@example.com",
} as const;

export const PAGE_SIZE = 10;

/** EMI shown on cards: monthly instalment over EMI_MONTHS at EMI_MONTHLY_RATE. Fitted to reference figures (₹16,000 → ₹1,558, ₹22,000 → ₹2,142); confirm the real rule. */
export const EMI_MONTHS = 12;
export const EMI_MONTHLY_RATE = 0.0248;

export const DURATION_BUCKETS = [
  { key: "1-3", label: "1 to 3 days", min: 1, max: 3 },
  { key: "4-6", label: "4 to 6 days", min: 4, max: 6 },
  { key: "7-9", label: "7 to 9 days", min: 7, max: 9 },
  { key: "10+", label: "10+ days", min: 10, max: 999 },
] as const;

export const BUDGET_BUCKETS = [
  { key: "0-15000", label: "Under ₹15,000", min: 0, max: 15000 },
  { key: "15000-25000", label: "₹15,000 to ₹25,000", min: 15000, max: 25000 },
  { key: "25000-50000", label: "₹25,000 to ₹50,000", min: 25000, max: 50000 },
  { key: "50000+", label: "Above ₹50,000", min: 50000, max: 100000000 },
] as const;

export const SORTS = [
  { key: "deals", label: "Deals" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "duration", label: "Duration" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export const TAG_OPTIONS = ["Family", "Beach", "Heritage", "Desert", "Hill station", "Wildlife", "Honeymoon", "Adventure"];
export const INCLUDE_KEYS = ["hotel", "meals", "flight", "sightseeing", "transport", "visa"] as const;
export type IncludeKey = (typeof INCLUDE_KEYS)[number];
export const MEAL_CODES = ["B", "L", "D"] as const;
