import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { listEnquiries } from "@/lib/packages";
import type { EnquiryKind, EnquiryStatus } from "@/lib/types";
import { btnSecondary, card, inputCls, td, th } from "@/components/admin/ui";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Enquiries", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ["new", "contacted", "booked", "lost"].includes(one(sp.status)) ? (one(sp.status) as EnquiryStatus) : undefined;
  const kind = ["enquiry", "callback"].includes(one(sp.kind)) ? (one(sp.kind) as EnquiryKind) : undefined;
  const rows = await listEnquiries({ status, kind });
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (kind) qs.set("kind", kind);
  const exportHref = `/admin/enquiries/export${qs.size ? `?${qs}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <a href={exportHref} className={btnSecondary}>Export CSV</a>
      </div>

      <form method="get" className={`${card} flex flex-wrap items-end gap-3`}>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className={inputCls}>
            <option value="">All</option>
            <option value="new">New</option><option value="contacted">Contacted</option>
            <option value="booked">Booked</option><option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label htmlFor="kind" className="mb-1 block text-sm font-medium">Kind</label>
          <select id="kind" name="kind" defaultValue={kind ?? ""} className={inputCls}>
            <option value="">All</option>
            <option value="enquiry">Enquiry</option><option value="callback">Call-back</option>
          </select>
        </div>
        <button type="submit" className={btnSecondary}>Filter</button>
        {(status || kind) && <Link href="/admin/enquiries" className="py-2 text-sm text-accent underline">Clear</Link>}
      </form>

      <p className="text-sm text-ink-500" aria-live="polite">{rows.length} {rows.length === 1 ? "enquiry" : "enquiries"}</p>

      <div className={`${card} !p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] divide-y divide-ink-200">
            <caption className="sr-only">Enquiries</caption>
            <thead className="bg-ink-50">
              <tr>
                <th scope="col" className={th}>Received</th><th scope="col" className={th}>Kind</th><th scope="col" className={th}>Name</th>
                <th scope="col" className={th}>Phone</th><th scope="col" className={th}>Email</th><th scope="col" className={th}>Package</th>
                <th scope="col" className={th}>Travel date</th><th scope="col" className={th}>Travellers</th>
                <th scope="col" className={th}>Message</th><th scope="col" className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {rows.length === 0 && <tr><td colSpan={10} className={`${td} text-ink-500`}>No enquiries yet.</td></tr>}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDate(e.createdAt.slice(0, 10))}</td>
                  <td className={td}>{e.kind === "callback" ? "Call-back" : "Enquiry"}</td>
                  <td className={`${td} font-medium`}>{e.name}</td>
                  <td className={`${td} whitespace-nowrap`}><a href={`tel:${e.phone.replace(/[^+\d]/g, "")}`} className="text-accent hover:underline">{e.phone}</a></td>
                  <td className={`${td} break-all`}>{e.email ? <a href={`mailto:${e.email}`} className="text-accent hover:underline">{e.email}</a> : "–"}</td>
                  <td className={td}>{e.packageTitle ?? "–"}</td>
                  <td className={`${td} whitespace-nowrap`}>{e.travelDate ? formatDate(e.travelDate) : "–"}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {e.adults == null && e.children == null ? "–" : `${e.adults ?? 0} adults${e.children ? `, ${e.children} children` : ""}`}
                  </td>
                  <td className={`${td} max-w-xs`}>
                    {e.message ? (
                      <details>
                        <summary className="cursor-pointer text-accent">{e.message.length > 40 ? `${e.message.slice(0, 40)}...` : e.message}</summary>
                        <p className="mt-1 whitespace-pre-wrap break-words">{e.message}</p>
                      </details>
                    ) : "–"}
                  </td>
                  <td className={td}><StatusSelect id={e.id} status={e.status} who={e.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
