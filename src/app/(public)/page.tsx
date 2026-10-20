import Link from "next/link";
import { connection } from "next/server";
import { PackageTile } from "@/components/public/PackageTile";
import { CheckIcon, ShieldIcon, PhoneIcon, SearchIcon } from "@/components/public/icons";
import { btnPrimary, focusRing, wrap } from "@/components/public/ui";
import { BRAND } from "@/lib/config";
import { listPublished } from "@/lib/packages";

const WHY = [
  { title: "Planned around you", text: "Your dates, your budget, your pace. Every itinerary is adjusted before you pay anything.", icon: CheckIcon },
  { title: "Clear, honest pricing", text: "Prices come from real departures, with inclusions and exclusions spelled out on each package.", icon: ShieldIcon },
  { title: "A real person to call", text: "Talk to a travel expert before, during and after your trip.", icon: PhoneIcon },
];

export default async function HomePage() {
  await connection();
  const { items } = await listPublished({ sort: "deals" });
  const featured = items.slice(0, 4);

  return (
    <>
      <section className="bg-linear-to-br from-ink-900 via-ink-700 to-accent text-white">
        <div className={`${wrap} py-14 md:py-20`}>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">Customized family holidays, planned around you</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Pick a destination, tell us your dates and we will take care of stay, meals, sightseeing and transfers.</p>
          <form action="/holidays" method="get" role="search" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="home-search" className="sr-only">Search holidays</label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
              <input id="home-search" name="q" type="search" placeholder='Where to? Try "Goa" or "Kutch"' className={`w-full rounded-md bg-white py-3 pl-10 pr-3 text-ink-900 placeholder:text-ink-500 ${focusRing}`} />
            </div>
            <button type="submit" className={btnPrimary}>Search holidays</button>
          </form>
        </div>
      </section>

      <section aria-labelledby="featured-title" className={`${wrap} py-12`}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="featured-title" className="text-2xl font-semibold">Family holidays</h2>
          <Link href="/holidays" className={`font-medium text-accent underline ${focusRing}`}>View all holidays</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-ink-500">New holidays are on the way. <a className="underline" href={BRAND.phoneHref}>Call {BRAND.phone}</a> to plan one with us.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <li key={c.id}><PackageTile card={c} /></li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="why-title" className="bg-ink-50 py-12">
        <div className={wrap}>
          <h2 id="why-title" className="mb-6 text-2xl font-semibold">Why Girikand Holidays</h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {WHY.map(({ title, text, icon: Icon }) => (
              <li key={title} className="rounded-xl border border-ink-200 bg-white p-5">
                <Icon className="h-7 w-7 text-accent" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-ink-700">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
