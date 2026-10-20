import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { emptyForm } from "@/components/admin/schema";
import { PackageEditor } from "@/components/admin/package-editor";

export const metadata: Metadata = { title: "New package", robots: { index: false, follow: false } };

export default async function NewPackagePage() {
  await requireAdmin();
  return <PackageEditor packageId={null} initial={emptyForm()} status="draft" departures={[]} slugLocked={false} />;
}
