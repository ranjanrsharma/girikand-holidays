import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { listAllPackages } from "@/lib/packages";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { btnPrimary, btnSecondary, btnSmall, card, inputCls, td, th } from "@/components/admin/ui";
import { deletePackageAction, duplicatePackageAction, setPackageStatusAction } from "./actions";

export const metadata: Metadata = { title: "Packages", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const badge: Record<string, string> = {
  draft: "bg-ink-100 text-ink-700",
  published: "bg-good/15 text-good",
  archived: "bg-warn/15 text-warn",
};

function RowAction({ id, action, label, to, what }: { id: number; action: (f: FormData) => Promise<void>; label: string; to?: string; what: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {to && <input type="hidden" name="to" value={to} />}
      <button type="submit" className={`${btnSecondary} ${btnSmall}`} aria-label={`${label} ${what}`}>{label}</button>
    </form>
  );
}

export default async function PackagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase();
  const status = one(sp.status);
  const notice = one(sp.notice);
  const error = one(sp.error);

  const all = await listAllPackages();
  const rows = all.filter((p) => {
    if (status && p.status !== status) return false;
    if (q && ![p.title, p.code, p.slug, p.state ?? "", p.country].join(" ").toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Packages</h1>
        <Link href="/admin/packages/new" className={btnPrimary}>New package</Link>
      </div>

      <div aria-live="polite">
        {notice && <p role="status" className="rounded-md border border-good bg-good/10 px-3 py-2 text-sm text-good">{notice}</p>}
        {error && <p role="alert" className="rounded-md border border-bad bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      </div>

      <form method="get" className={`${card} flex flex-wrap items-end gap-3`}>
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-sm font-medium">Search</label>
          <input id="q" name="q" type="search" defaultValue={one(sp.q)} placeholder="Title, code or state" className={inputCls} />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={status} className={inputCls}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button type="submit" className={btnSecondary}>Filter</button>
        {(q || status) && <Link href="/admin" className="py-2 text-sm text-accent underline">Clear</Link>}
      </form>

      <div className={`${card} !p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] divide-y divide-ink-200">
            <caption className="sr-only">Packages</caption>
            <thead className="bg-ink-50">
              <tr>
                <th scope="col" className={th}>Title</th><th scope="col" className={th}>Code</th><th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Days / nights</th><th scope="col" className={th}>State</th>
                <th scope="col" className={th}>Lowest price</th><th scope="col" className={th}>Departures</th>
                <th scope="col" className={th}>Enquiries</th><th scope="col" className={th}>Updated</th><th scope="col" className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {rows.length === 0 && (
                <tr><td colSpan={10} className={`${td} text-ink-500`}>No packages match.</td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/packages/${p.id}`} className="text-accent hover:underline">{p.title}</Link>
                  </td>
                  <td className={td}>{p.code}</td>
                  <td className={td}>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[p.status]}`}>{p.status}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{p.days}D / {p.nights}N</td>
                  <td className={td}>{p.state ?? p.country}</td>
                  <td className={`${td} whitespace-nowrap`}>{p.minPrice != null ? formatINR(p.minPrice) : "–"}</td>
                  <td className={td}>{p.departureCount}</td>
                  <td className={td}>{p.enquiryCount}</td>
                  <td className={`${td} whitespace-nowrap`}>{formatDate(p.updatedAt.slice(0, 10))}</td>
                  <td className={td}>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link href={`/admin/packages/${p.id}`} className={`${btnSecondary} ${btnSmall}`} aria-label={`Edit ${p.title}`}>Edit</Link>
                      <RowAction id={p.id} action={duplicatePackageAction} label="Duplicate" what={p.title} />
                      {p.status === "published" ? (
                        <RowAction id={p.id} action={setPackageStatusAction} to="draft" label="Unpublish" what={p.title} />
                      ) : (
                        <RowAction id={p.id} action={setPackageStatusAction} to="published" label="Publish" what={p.title} />
                      )}
                      {p.status !== "archived" && <RowAction id={p.id} action={setPackageStatusAction} to="archived" label="Archive" what={p.title} />}
                      <form action={deletePackageAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit label="Delete" what={p.title} confirmLabel="Yes, delete" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
