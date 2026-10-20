import type { Metadata } from "next";
import Link from "next/link";
import { CallbackForm } from "@/components/public/CallbackForm";
import { Faq } from "@/components/public/Faq";
import { FilterChips } from "@/components/public/FilterChips";
import { FilterDrawer } from "@/components/public/FilterDrawer";
import { PackageCard } from "@/components/public/PackageCard";
import { Pagination } from "@/components/public/Pagination";
import { ReadMore } from "@/components/public/ReadMore";
import { SortSelect } from "@/components/public/SortSelect";
import { btnPrimary, wrap } from "@/components/public/ui";
import { listHref, parseFilters, type RawParams } from "@/components/public/listing-url";
import { SORTS } from "@/lib/config";
import { getFilterOptions, listPublished } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Family Holidays Tour Packages",
  description: "Browse customized family holiday packages. Filter by destination, duration, budget, month and departure city, then send an enquiry.",
};

const FAQS = [
  { q: "What does a customized family holiday mean?", a: "You tell us your dates, budget and pace, and we shape the itinerary, hotels and sightseeing around your family instead of fitting you into a fixed group departure." },
  { q: "Can I change the hotels or activities in a package?", a: "Yes. Every package is a starting point. Share what you would like to swap and we will quote the changed version before you decide anything." },
  { q: "What is usually included in the price?", a: "Stay, the meals mentioned in the itinerary, private transfers and the sightseeing listed. Flights are optional and always shown separately. Open any package to see its exact inclusions and exclusions." },
  { q: "How early should I plan my family holiday?", a: "Two to three months ahead gives the best choice of hotels and dates, especially for school holidays and festival weeks. Last-minute trips are possible when seats are free." },
  { q: "How do I book, and when do I pay?", a: "Send an enquiry or request a call back. A travel expert will confirm availability and share the payment schedule. The booking is confirmed only after the first payment." },
];

export default async function HolidaysPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const filters = parseFilters(await searchParams);
  const [result, options] = await Promise.all([listPublished(filters), getFilterOptions()]);
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);
  const sort = filters.sort ?? "deals";
  const selected = { state: filters.state, duration: filters.duration, budget: filters.budget, month: filters.month, departureCity: filters.departureCity, tag: filters.tag };

  return (
    <>
      <div className="bg-white">
        <div className={`${wrap} grid gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10`}>
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:underline">Home</Link></li>
                <li aria-hidden="true">›</li>
                <li><Link href="/holidays" className="hover:underline">Customized Holidays</Link></li>
                <li aria-hidden="true">›</li>
                <li aria-current="page" className="font-semibold text-ink-900">Family Holidays Tour Packages</li>
              </ol>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold text-ink-900">Family Holidays Tour Packages</h1>
            <p className="mt-3 max-w-2xl text-ink-700">
              Holidays that fit your family, not the other way round. Pick a package as it is or tell us what to change, and we will plan the rest.
            </p>
            <ReadMore className="mt-1 max-w-2xl text-ink-700">
              <p className="mt-2">Each package lists its stay, meals, sightseeing and transfers up front. Flights are optional and priced separately, so you only pay for what you need.</p>
            </ReadMore>
          </div>
          <CallbackForm idPrefix="cb-list" />
        </div>
      </div>

      <div className="bg-ink-50 pb-4 pt-6">
        <div className={wrap}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterDrawer options={options} selected={selected} q={filters.q} sort={filters.sort} />
            <SortSelect value={sort} options={SORTS.map((s) => ({ key: s.key, label: s.label, href: listHref(filters, { sort: s.key === "deals" ? undefined : s.key, page: undefined }) }))} />
          </div>
          <FilterChips filters={filters} options={options} />

          <h2 className="mt-5 text-xl font-semibold text-ink-900" data-testid="result-count">
            {result.total} Family Holidays Packages
          </h2>
          <p className="text-ink-500">Showing {from}-{to} of {result.total} packages</p>

          {result.total === 0 ? (
            <div className="mt-6 rounded-xl border border-ink-200 bg-white p-8 text-center" data-testid="empty-state">
              <p className="text-lg font-semibold">No holidays match these filters</p>
              <p className="mt-1 text-ink-500">Try removing a filter, or tell us what you are looking for and we will plan it.</p>
              <Link href="/holidays" className={`${btnPrimary} mt-5`}>Clear filters</Link>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {result.items.map((card) => <PackageCard key={card.id} card={card} />)}
            </div>
          )}

          <Pagination page={result.page} pageCount={result.pageCount} filters={filters} />
        </div>
      </div>

      <section aria-labelledby="faq-title" className="bg-ink-50 pb-4 pt-10">
        <div className={`${wrap} max-w-4xl`}>
          <h2 id="faq-title" className="text-center text-xl font-semibold text-ink-900">Family Holidays: Frequently Asked Questions</h2>
          <p className="mb-5 mt-1 text-center text-sm text-ink-500">A few answers to help you prepare for your trip.</p>
          <Faq items={FAQS} />
        </div>
      </section>

      <section className="bg-ink-50 pb-4 pt-8">
        <div className={`${wrap} max-w-4xl text-sm leading-relaxed text-ink-700`}>
          <p>A family holiday works best when it follows your own rhythm: a slow morning at the beach, a longer drive on the day the children are happy in the car, a hotel with a pool. Girikand Holidays plans trips around those details.</p>
          <ReadMore>
            <p className="mt-3">Start with any package here, then tell us your travel dates, how many adults and children are travelling and what you would rather skip. We adjust the stay, transfers and sightseeing and send back a clear quote.</p>
            <h2 className="mt-4 text-base font-semibold text-ink-900">Popular family holidays from India</h2>
            <p className="mt-1">Beach breaks, desert camps, heritage towns and hill stations all work well with children of different ages. Use the filters to narrow by month, budget and departure city.</p>
          </ReadMore>
        </div>
      </section>
    </>
  );
}
