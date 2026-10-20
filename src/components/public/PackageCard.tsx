import Link from "next/link";
import { BRAND } from "@/lib/config";
import { formatINR } from "@/lib/money";
import type { PackageCard as Card } from "@/lib/types";
import { EnquiryButton } from "./EnquiryProvider";
import { IncludesRow } from "./IncludesRow";
import { PackageImage } from "./PlaceholderImage";
import { PhoneIcon, MailIcon } from "./icons";
import { btnPrimary, focusRing } from "./ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function PackageCard({ card }: { card: Card }) {
  const hasPrice = !card.priceHidden && card.minPrice !== null;
  const href = `/package/${card.slug}`;
  return (
    <article data-testid="package-card" className="grid gap-4 rounded-xl border border-ink-200 bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_220px]">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block aspect-16/10 overflow-hidden rounded-lg md:aspect-square">
        <PackageImage src={card.heroImage} title={card.title} />
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {card.badge && <span className="rounded-sm border border-accent px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">{card.badge}</span>}
          <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">{card.code}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-ink-900">
          <Link href={href} className={`hover:text-accent ${focusRing}`}>{card.title}</Link>
        </h3>
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-ink-700">Holiday includes</p>
          <IncludesRow includes={card.includes} />
        </div>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-3 text-ink-700">
          <span><strong className="text-ink-900">{card.days}</strong> Days</span>
          {card.countryCount > 0 && <span><strong className="text-ink-900">{card.countryCount}</strong> {card.countryCount === 1 ? "Country" : "Countries"}</span>}
          <span><strong className="text-ink-900">{card.cityCount}</strong> {card.cityCount === 1 ? "City" : "Cities"}</span>
          {card.departureCount > 0 && <span className="text-accent"><strong>{plural(card.departureCount, "Date", "Dates")}</strong></span>}
        </p>
        <div className="mt-3 border-t border-ink-200 pt-3 text-sm text-ink-500">
          Customize this holiday
          <a href={BRAND.phoneHref} className={`mt-0.5 flex items-center gap-2 font-semibold text-ink-900 ${focusRing}`}>
            <PhoneIcon className="h-4 w-4 text-accent" /> {BRAND.phone}
          </a>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
          {hasPrice ? (
            <div className="text-right">
              <p className="text-sm text-ink-500">Starting price per person</p>
              <p className="text-2xl font-bold text-ink-900" data-testid="card-price">{formatINR(card.minPrice!)}</p>
              {card.emiPerMonth !== null && (
                <p className="text-sm text-ink-700">EMI from <span className="font-semibold underline">{formatINR(card.emiPerMonth)}</span>/month</p>
              )}
            </div>
          ) : (
            <p className="py-3 text-right font-medium text-ink-700" data-testid="card-price-on-request">Price on request</p>
          )}
          <Link href={href} className={`${btnPrimary} w-full`}>View Details</Link>
        </div>
        <div className="flex border-t border-ink-200 bg-white">
          <EnquiryButton pkg={{ id: card.id, title: card.title }} className={`flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-ink-900 underline hover:text-accent ${focusRing}`}>
            <MailIcon className="h-4 w-4" /> Enquire Now
          </EnquiryButton>
        </div>
      </div>
    </article>
  );
}
