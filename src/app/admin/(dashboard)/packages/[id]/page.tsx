import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPackageById } from "@/lib/packages";
import { recordToForm } from "@/components/admin/schema";
import { PackageEditor } from "@/components/admin/package-editor";

export const metadata: Metadata = { title: "Edit package", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function EditPackagePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const n = /^\d+$/.test(id) ? Number(id) : NaN;
  const pkg = Number.isSafeInteger(n) ? await getPackageById(n) : null;
  if (!pkg) notFound();
  const banner = sp.created ? "Package created as a draft." : sp.copied ? "Copy created as a draft. Check the slug, code and departures." : undefined;
  return (
    <PackageEditor
      key={pkg.id}
      packageId={pkg.id}
      initial={recordToForm(pkg)}
      status={pkg.status}
      departures={pkg.departures}
      slugLocked
      banner={banner}
    />
  );
}
