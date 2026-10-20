import { DEFAULT_CANCELLATION_NOTES, DEFAULT_PAYMENT_TERMS, DEFAULT_SLABS } from "../src/lib/cancellation";
import { addDays, todayISO } from "../src/lib/dates";
import type { Db } from "../src/lib/db";
import { saveDeparture, savePackage } from "../src/lib/packages";
import type { PackageInput } from "../src/lib/types";

const base: Omit<PackageInput, "slug" | "code" | "title" | "days" | "nights" | "overview" | "highlights" | "state" | "cities" | "tags" | "itinerary" | "inclusions" | "exclusions" | "includes" | "needToKnow" | "remarks"> = {
  category: "family",
  type: "customized",
  badge: null,
  heroImage: null,
  gallery: [],
  region: "India",
  country: "India",
  tourManager: true,
  cancellationSlabs: DEFAULT_SLABS,
  cancellationNotes: DEFAULT_CANCELLATION_NOTES,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
  priceHidden: false,
  status: "published",
  isFeatured: false,
};

const remarks = [
  "Room upgrades and complimentary items are not provided unless confirmed in writing at the time of booking.",
  "A security deposit may be collected by the hotel at check-in and is refunded if there is no damage.",
  "Guests are responsible for their valuables while sightseeing; the company is not liable for loss.",
];

export const GOA: PackageInput = {
  ...base,
  slug: "goa-beach-resort-getaway",
  code: "GHGA1",
  title: "Goa Beach Resort Getaway",
  badge: "Customized Holiday",
  days: 4,
  nights: 3,
  isFeatured: true,
  overview: "Four relaxed days in North Goa with a resort stay, a guided sightseeing day and plenty of time on the beach.",
  highlights: ["Three nights at a North Goa resort with pool", "Half-day North Goa sightseeing by private car", "Evening at leisure on Baga and Calangute beaches"],
  state: "Goa",
  cities: [{ name: "North Goa", nights: 3 }],
  tags: ["Family", "Beach"],
  includes: { hotel: "yes", meals: "yes", flight: "optional", sightseeing: "yes", transport: "yes" },
  itinerary: [
    { title: "Arrive in Goa and check in", description: "Meet your driver on arrival and transfer to the resort. Check in, settle in and spend the evening at leisure by the pool.", city: "North Goa", distanceKm: 40, driveTime: "1 hr 15 min", meals: ["D"] },
    { title: "North Goa sightseeing", description: "After breakfast, a half-day drive past forts, a hilltop chapel and the main beaches. The rest of the day is free.", city: "North Goa", distanceKm: 35, driveTime: "1 hr", meals: ["B", "D"] },
    { title: "Free day at the beach", description: "A full day to relax, swim or add optional water sports on your own.", city: "North Goa", meals: ["B", "D"] },
    { title: "Check out and depart", description: "Breakfast, check out and transfer to the airport or station for your onward journey.", city: "North Goa", distanceKm: 40, driveTime: "1 hr 15 min", meals: ["B"] },
  ],
  inclusions: ["3 nights' accommodation at a resort in North Goa", "Daily breakfast and dinner", "Airport or station transfers and one half-day sightseeing tour by private car", "All taxes on the above"],
  exclusions: ["Airfare or train fare unless booked with the package", "Lunches and personal expenses", "Water sports, entry fees and anything not listed under inclusions"],
  needToKnow: ["Carry a valid photo ID for every guest; check-in is after 2 pm and check-out before 11 am.", "Sightseeing order can change with traffic and weather."],
  remarks,
};

export const KUTCH: PackageInput = {
  ...base,
  slug: "kutch-white-desert-tent-stay",
  code: "GHGJ1",
  title: "Kutch White Desert Tent Stay",
  badge: "Customized Holiday",
  days: 3,
  nights: 2,
  overview: "Two nights in a tent camp at the edge of the white desert, with a day at the ancient city of Dholavira.",
  highlights: ["Two nights in a tent camp near the white desert", "A guided visit to the Dholavira archaeological site", "Sunset at the salt flats"],
  state: "Gujarat",
  cities: [{ name: "Dholavira", nights: 2 }],
  tags: ["Family", "Desert", "Heritage"],
  includes: { hotel: "yes", meals: "yes", flight: "optional", sightseeing: "yes", transport: "yes" },
  itinerary: [
    { title: "Bhuj to Dholavira", description: "Meet at Bhuj station or airport and drive to the camp, with stops for tea along the way. Check in and watch the sun go down over the salt flats.", city: "Dholavira", distanceKm: 125, driveTime: "2 hr 15 min", meals: ["D"] },
    { title: "Dholavira ruins and salt flats", description: "Visit the Harappan site in the morning, then spend the afternoon at the camp. Evening at the salt flats.", city: "Dholavira", meals: ["B", "D"] },
    { title: "Return to Bhuj", description: "Breakfast, check out and drive back to Bhuj for your onward journey.", city: "Dholavira", distanceKm: 125, driveTime: "2 hr 15 min", meals: ["B"] },
  ],
  inclusions: ["2 nights' stay in tents or cottages, as chosen", "Meals as shown in the itinerary", "Transfers from Bhuj station or airport and back by private car", "Sightseeing as listed in the itinerary"],
  exclusions: ["Airfare or train fare", "Entry fees for the archaeological site and camera charges", "Any meal or service not listed"],
  needToKnow: ["Nights are cold in winter and days are hot; carry layers and sun protection.", "Mobile signal at the camp is weak."],
  remarks,
};

export async function seedIfEmpty(db: Db): Promise<void> {
  const [{ n }] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM packages");
  if (n > 0) return;
  const goa = await savePackage(null, GOA, db);
  const kutch = await savePackage(null, KUTCH, db);
  const t = todayISO();
  const dep = (packageId: number, offset: number, city: string, seatsTotal: number, seatsLeft: number, twin: number, offer: number | null = null) =>
    saveDeparture(null, {
      packageId, date: addDays(t, offset), departureCity: city, seatsTotal, seatsLeft, priceTwin: twin,
      priceTriple: Math.round(twin * 0.95), priceSingle: Math.round(twin * 1.45), priceChildBed: Math.round(twin * 0.85),
      priceChildNoBed: Math.round(twin * 0.6), offerPriceTwin: offer,
    }, db);
  await dep(goa, 21, "Mumbai", 20, 14, 17000, 15000);
  await dep(goa, 35, "Pune", 20, 4, 17500);
  await dep(goa, 63, "Mumbai", 20, 20, 17000);
  await dep(goa, 94, "Bengaluru", 16, 0, 18500);
  await dep(kutch, 25, "Bhuj", 24, 18, 16000);
  await dep(kutch, 56, "Bhuj", 24, 24, 16000);
  await dep(kutch, 87, "Ahmedabad", 24, 9, 18500);
}
