import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import { PhoneIcon, SearchIcon } from "./icons";
import { MobileNav } from "./MobileNav";
import { focusRing, wrap } from "./ui";

export const NAV_LINKS = [
  { href: "/holidays", label: "Family Holidays" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <div className="print:hidden">
      <div className="bg-brand/20 text-center text-sm text-ink-900">
        <p className={`${wrap} py-2`}>
          <strong className="font-semibold">Planning a family trip?</strong> Tell us your dates and we will shape the holiday around you.
        </p>
      </div>
      <header className="bg-ink-900 text-white">
        <div className={`${wrap} flex items-center gap-3 py-3 md:gap-5`}>
          <MobileNav links={NAV_LINKS} />
          <Link href="/" aria-label={`${BRAND.name} home`} className={`shrink-0 rounded ${focusRing}`}>
            <Image src="/brand/girikand-logo.png" alt={BRAND.name} width={298} height={100} priority className="h-9 w-auto md:h-10" />
          </Link>
          <form action="/holidays" method="get" role="search" className="relative hidden min-w-0 max-w-xl flex-1 md:block">
            <label htmlFor="site-search" className="sr-only">Search holidays</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder='Search "Goa" or "Kutch"'
              className={`w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-ink-900 placeholder:text-ink-500 ${focusRing}`}
            />
          </form>
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`rounded px-3 py-2 text-sm font-medium hover:bg-white/10 ${focusRing}`}>{l.label}</Link>
            ))}
          </nav>
          <a href={BRAND.phoneHref} className={`ml-auto inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 lg:ml-0 ${focusRing}`}>
            <PhoneIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{BRAND.phone}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
        <form action="/holidays" method="get" role="search" className={`${wrap} relative pb-3 md:hidden`}>
          <label htmlFor="site-search-m" className="sr-only">Search holidays</label>
          <SearchIcon className="pointer-events-none absolute left-7 top-[calc(50%-6px)] h-5 w-5 -translate-y-1/2 text-ink-500" />
          <input id="site-search-m" name="q" type="search" placeholder='Search "Goa" or "Kutch"' className={`w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-ink-900 placeholder:text-ink-500 ${focusRing}`} />
        </form>
      </header>
    </div>
  );
}
