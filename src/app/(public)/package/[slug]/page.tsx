import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallbackForm } from "@/components/public/CallbackForm";
import { CancellationSection } from "@/components/public/CancellationSection";
import { DepartureProvider } from "@/components/public/DepartureProvider";
import { DeparturesSection } from "@/components/public/DeparturesSection";
import { EnquiryButton } from "@/components/public/EnquiryProvider";
import { IncludesRow } from "@/components/public/IncludesRow";
import { ItinerarySection } from "@/components/public/ItinerarySection";
import { PackageImage } from "@/components/public/PlaceholderImage";
import { SectionTabs } from "@/components/public/SectionTabs";
import { TourInfoSection } from "@/components/public/TourInfoSection";
import { ChevronRightIcon, PinIcon } from "@/components/public/icons";
import { btnOutline, btnPrimary, focusRing, wrap } from "@/components/public/ui";
import { emiPerMonth, formatINR } from "@/lib/money";
import { effectivePrice, getPublishedBySlug } from "@/lib/packages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPublishedBySlug(slug);
  if (!pkg) return { title: "Holiday not found" };
  const description = pkg.overview.length > 160 ? pkg.overview.slice(0, 157).trimEnd() + "..." : pkg.overview;
  return { title: pkg.title, description, openGraph: { title: pkg.title, description } };
}

const WHY = [
  "Holiday planning with real expertise and a personal touch.",
  "Flexible, tailor-made experiences for every family.",
  "Clear prices and inclusions before you commit.",
];

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPublishedBySlug(slug);
  if (!pkg) notFound();

  const bookable = pkg.departures.filter((d) => d.status !== "sold-out");
  const minPrice = !pkg.priceHidden && bookable.length ? Math.min(...bookable.map(effectivePrice)) : null;
  const target = { id: pkg.id, title: pkg.title };
  const cityCount = pkg.cities.length;
  const place = pkg.state ?? pkg.country;

  return (
    <>
      <div className={wrap}>
        <nav aria-label="Breadcrumb" className="py-3 text-sm text-ink-700 print:hidden">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/holidays" className="hover:underline">{pkg.region}</Link></li>
            {pkg.state && (<><li aria-hidden="true">›</li><li><Link href={`/holidays?state=${encodeURIComponent(pkg.state)}`} className="hover:underline">{pkg.state}</Link></li></>)}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-semibold text-ink-900">{pkg.title}</li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="aspect-16/9 overflow-hidden rounded-lg lg:aspect-21/9">
              <PackageImage src={pkg.heroImage} title={pkg.title} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {pkg.badge && <span className="rounded-sm border border-accent px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">{pkg.badge}</span>}
              <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">{pkg.code}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">{pkg.title}</h1>
            <p className="mt-3 inline-block rounded-md bg-ink-100 px-3 py-1.5 font-medium" data-testid="summary-line">
              {pkg.days} Days | {pkg.region === "World" ? "1 Country" : `${pkg.state ? 1 : 0} State`} | {cityCount} {cityCount === 1 ? "City" : "Cities"}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-ink-700">
              <PinIcon className="h-4 w-4 text-ink-500" />
              <strong className="text-ink-900">{place}</strong>
              {pkg.cities.map((c) => <span key={c.name}>{c.name} ({c.nights}N)</span>)}
            </p>
            <a href="#itinerary" className={`mt-3 inline-flex items-center gap-1 font-semibold underline ${focusRing}`}>
              View day-wise tour itinerary <ChevronRightIcon className="h-4 w-4" />
            </a>
          </div>

          <aside aria-label="Price" className="self-start overflow-hidden rounded-lg border border-ink-200 print:hidden">
            <div className="p-4">
              {minPrice !== null ? (
                <>
                  <p className="text-ink-500">Starts from</p>
                  <p className="text-2xl font-bold" data-testid="starts-from">{formatINR(minPrice)}</p>
                  <p className="text-sm text-ink-500">per person on twin sharing</p>
                  <p className="mt-1 text-sm text-ink-700">EMI from <strong>{formatINR(emiPerMonth(minPrice))}</strong>/month</p>
                </>
              ) : pkg.priceHidden ? (
                <p className="font-semibold">Price on request</p>
              ) : (
                <p className="font-semibold" data-testid="no-price">{pkg.departures.length === 0 ? "No upcoming departures, enquire for dates" : "All departures are sold out, enquire for dates"}</p>
              )}
            </div>
            <div className="space-y-3 bg-ink-900 p-4">
              <a href="#dates" className={`${btnPrimary} w-full`}>Dates &amp; Availability</a>
              <div className="flex items-center justify-between gap-3 text-sm">
                <EnquiryButton pkg={target} className={`font-semibold text-white underline ${focusRing}`}>Enquire Now</EnquiryButton>
                {minPrice !== null && <a href="#dates" className={`font-semibold text-white underline ${focusRing}`}>Pricing table</a>}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-6 rounded-xl border border-ink-200 p-5 md:grid-cols-2 md:divide-x md:divide-ink-200 print:hidden">
          <div>
            <h2 className="mb-3 font-semibold">Tour Includes</h2>
            <div className="pt-2"><IncludesRow includes={pkg.includes} size="lg" /></div>
            {pkg.tourManager && <p className="mt-4 text-ink-700" data-testid="tour-manager">Girikand tour manager available upon request.</p>}
          </div>
          <div className="md:pl-6">
            <h2 className="mb-3 font-semibold">Why travel with Girikand</h2>
            <ul className="space-y-2 text-ink-700">
              {WHY.map((w) => (
                <li key={w} className="flex gap-2"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />{w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 print:hidden">
          <CallbackForm packageId={pkg.id} layout="row" idPrefix="cb-pkg" />
        </div>
      </div>

      <div className={wrap}>
        <DepartureProvider departures={pkg.departures} priceHidden={pkg.priceHidden}>
          <DeparturesSection pkg={target} />
          <div>
            <SectionTabs />
            <ItinerarySection days={pkg.itinerary} pkg={target} />
            <TourInfoSection inclusions={pkg.inclusions} exclusions={pkg.exclusions} needToKnow={pkg.needToKnow} />
            <CancellationSection pkg={target} slabs={pkg.cancellationSlabs} notes={pkg.cancellationNotes} paymentTerms={pkg.paymentTerms} remarks={pkg.remarks} />
          </div>
        </DepartureProvider>
        <div className="py-6 text-center print:hidden">
          <Link href="/holidays" className={btnOutline}>Back to all holidays</Link>
        </div>
      </div>
    </>
  );
}
