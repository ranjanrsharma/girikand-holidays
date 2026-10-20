import { addDays } from "./dates";
import type { CancellationSlab, PaymentSector } from "./types";

export interface ComputedSlab {
  percent: number;
  amount: number;
  fromDays: number;
  toDays: number;
  startDate: string; // inclusive
  endDate: string; // inclusive
}

/** Charges for a departure: each slab covers cancellations fromDays..toDays before departure. */
export function computeSlabs(slabs: CancellationSlab[], departureDate: string, pricePerPerson: number): ComputedSlab[] {
  return [...slabs]
    .sort((a, b) => b.fromDays - a.fromDays)
    .map((s) => ({
      percent: s.percent,
      amount: Math.round((pricePerPerson * s.percent) / 100),
      fromDays: s.fromDays,
      toDays: s.toDays,
      startDate: addDays(departureDate, -s.toDays),
      endDate: addDays(departureDate, -s.fromDays),
    }));
}

export const DEFAULT_SLABS: CancellationSlab[] = [
  { fromDays: 121, toDays: 900, percent: 10 },
  { fromDays: 91, toDays: 120, percent: 15 },
  { fromDays: 61, toDays: 90, percent: 20 },
  { fromDays: 46, toDays: 60, percent: 30 },
  { fromDays: 31, toDays: 45, percent: 40 },
  { fromDays: 16, toDays: 30, percent: 50 },
  { fromDays: 6, toDays: 15, percent: 75 },
  { fromDays: 0, toDays: 5, percent: 100 },
];

export const DEFAULT_CANCELLATION_NOTES = [
  "Cancellation charges are calculated on gross tour cost and depend on the date of departure and the date of cancellation.",
  "A cancellation must be requested in writing and is counted from the date the company receives it.",
  "Air tickets, if booked, follow the airline's own cancellation rules and are non-refundable in many cases.",
  "Any refund is paid after the company receives the refund from the respective suppliers.",
];

export const DEFAULT_PAYMENT_TERMS: PaymentSector[] = [
  {
    sector: "India",
    rows: [
      { label: "Package price less than INR 25,000 (per person)", payment: "Full payment" },
      { label: "Package price more than INR 25,000 (per person)", payment: "INR 25,000 registration amount per person" },
      { label: "45 days prior to departure", payment: "Full payment" },
    ],
  },
  {
    sector: "World",
    rows: [
      { label: "Package price less than INR 50,000 (per person)", payment: "INR 25,000 registration amount per person" },
      { label: "Package price more than INR 50,000 (per person)", payment: "INR 50,000 registration amount per person" },
      { label: "45 days prior to departure", payment: "Full payment" },
    ],
  },
  {
    sector: "Last minute booking (booking received within 45 days of departure)",
    rows: [{ label: "Registration amount equal to package price", payment: "Full payment" }],
  },
];
