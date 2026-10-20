import Link from "next/link";
import { formatINR } from "@/lib/money";
import type { PackageCard } from "@/lib/types";
import { PackageImage } from "./PlaceholderImage";
import { focusRing } from "./ui";

/** Compact package card for the home page. */
export function PackageTile({ card }: { card: PackageCard }) {
  return (
    <article className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <Link href={`/package/${card.slug}`} tabIndex={-1} aria-hidden="true" className="block aspect-16/10">
        <PackageImage src={card.heroImage} title={card.title} />
      </Link>
      <div className="p-4">
        <h3 className="font-semibold leading-snug">
          <Link href={`/package/${card.slug}`} className={`hover:text-accent ${focusRing}`}>{card.title}</Link>
        </h3>
        <p className="mt-1 text-sm text-ink-500">{card.days} Days · {card.cityCount} {card.cityCount === 1 ? "City" : "Cities"}</p>
        <p className="mt-3 text-sm text-ink-700">
          {!card.priceHidden && card.minPrice !== null ? (
            <>From <strong className="text-lg text-ink-900">{formatINR(card.minPrice)}</strong> per person</>
          ) : (
            <strong>Price on request</strong>
          )}
        </p>
      </div>
    </article>
  );
}
