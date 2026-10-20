import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { countNewEnquiries } from "@/lib/packages";
import { logoutAction } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const newCount = await countNewEnquiries();
  const link = "rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100";
  return (
    <>
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/brand/girikand-logo.png" alt="Girikand Holidays" width={120} height={36} className="h-8 w-auto" />
            <span className="rounded bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">Staff</span>
          </Link>
          <nav aria-label="Staff" className="order-last flex w-full flex-wrap items-center gap-1 sm:order-none sm:w-auto sm:flex-1">
            <Link href="/admin" className={link}>Packages</Link>
            <Link href="/admin/enquiries" className={link}>
              Enquiries
              {newCount > 0 && (
                <span className="ml-1.5 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-ink-900" aria-label={`${newCount} new`}>{newCount}</span>
              )}
            </Link>
            <a href="/" target="_blank" rel="noopener" className={link}>View site</a>
          </nav>
          <form action={logoutAction} className="ml-auto sm:ml-0">
            <button type="submit" className={`${link} border border-ink-200`}>Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
