import Link from "next/link";
import { BRAND } from "@/lib/config";
import { getFilterOptions } from "@/lib/packages";
import { MailIcon, PhoneIcon } from "./icons";
import { focusRing, wrap } from "./ui";

export async function SiteFooter() {
  let states: { value: string; count: number }[] = [];
  try {
    states = (await getFilterOptions()).states;
  } catch {
    states = [];
  }
  const link = `text-white/80 hover:text-white hover:underline ${focusRing}`;
  return (
    <footer id="contact" className="mt-16 print:hidden">
      <div className="border-t border-ink-200 bg-white">
        <div className={`${wrap} grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3`}>
          <div className="flex gap-3">
            <PhoneIcon className="mt-1 h-5 w-5 text-ink-500" />
            <div>
              <p className="text-ink-500">Request a quote</p>
              <a href={BRAND.phoneHref} className={`font-semibold underline ${focusRing}`}>{BRAND.phone}</a>
            </div>
          </div>
          <div className="flex gap-3">
            <MailIcon className="mt-1 h-5 w-5 text-ink-500" />
            <div>
              <p className="text-ink-500">For enquiries</p>
              <a href={`mailto:${BRAND.enquiryEmail}`} className={`break-all font-semibold underline ${focusRing}`}>{BRAND.enquiryEmail}</a>
            </div>
          </div>
          <div>
            <p className="text-ink-500">{BRAND.tagline}</p>
            <p className="font-semibold">Every trip planned around your family.</p>
          </div>
        </div>
      </div>
      <div className="bg-ink-900 text-white">
        <div className={`${wrap} grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3`}>
          <nav aria-label="Explore">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">Explore</h2>
            <ul className="space-y-2">
              <li><Link href="/" className={link}>Home</Link></li>
              <li><Link href="/holidays" className={link}>Family holidays</Link></li>
              <li><Link href="/holidays?sort=price-asc" className={link}>Lowest price first</Link></li>
              <li><a href="/sitemap.xml" className={link}>Site map</a></li>
            </ul>
          </nav>
          <nav aria-label="Destinations">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">Destinations</h2>
            <ul className="space-y-2">
              {states.length === 0 && <li className="text-white/60">Coming soon</li>}
              {states.map((s) => (
                <li key={s.value}><Link href={`/holidays?state=${encodeURIComponent(s.value)}`} className={link}>Holidays in {s.value}</Link></li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">Get in touch</h2>
            <ul className="space-y-2">
              <li><a href={BRAND.phoneHref} className={link}>{BRAND.phone}</a></li>
              <li><a href={`mailto:${BRAND.enquiryEmail}`} className={`${link} break-all`}>{BRAND.enquiryEmail}</a></li>
              <li className="text-white/60">We reply to every enquiry, usually within a working day.</li>
            </ul>
          </div>
        </div>
        <div className={`${wrap} border-t border-white/15 py-5 text-sm text-white/60`}>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
