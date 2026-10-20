import { EMI_MONTHLY_RATE, EMI_MONTHS } from "./config";

/** 125000 -> "₹1,25,000" (Indian digit grouping). */
export function formatINR(amount: number): string {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(amount));
}

/** Monthly instalment for a price, rounded to the nearest rupee. */
export function emiPerMonth(price: number): number {
  const r = EMI_MONTHLY_RATE;
  const f = Math.pow(1 + r, EMI_MONTHS);
  return Math.round((price * r * f) / (f - 1));
}

/** The price a visitor pays per person on twin sharing for a departure (offer price when set). */
export function effectivePrice(d: { priceTwin: number; offerPriceTwin: number | null }): number {
  return d.offerPriceTwin ?? d.priceTwin;
}
