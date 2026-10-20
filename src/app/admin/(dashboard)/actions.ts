"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, requireAdmin } from "@/lib/auth";
import { deletePackage, getPackageById, listAllPackages, savePackage, setEnquiryStatus, setPackageStatus } from "@/lib/packages";
import { publishMessage, publishProblems } from "@/components/admin/schema";
import type { EnquiryStatus, PackageInput } from "@/lib/types";

function idFrom(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin?error=" + encodeURIComponent("Unknown package."));
  return id;
}

function back(kind: "notice" | "error", msg: string): never {
  redirect(`/admin?${kind}=${encodeURIComponent(msg)}`);
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

export async function setPackageStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idFrom(formData);
  const to = String(formData.get("to"));
  if (to !== "draft" && to !== "published" && to !== "archived") back("error", "Unknown status.");
  const pkg = await getPackageById(id);
  if (!pkg) back("error", "That package no longer exists.");
  if (to === "published") {
    const problems = publishProblems({
      days: pkg.days, itinerary: pkg.itinerary, heroImage: pkg.heroImage, publishWithoutPhoto: false, departures: pkg.departures,
    });
    if (problems.length) back("error", `${pkg.title}: ${publishMessage(problems)} Open the editor to fix this.`);
  }
  await setPackageStatus(id, to);
  revalidatePath("/admin");
  revalidatePath(`/package/${pkg.slug}`);
  revalidatePath("/");
  back("notice", `${pkg.title} is now ${to}.`);
}

export async function duplicatePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idFrom(formData);
  const pkg = await getPackageById(id);
  if (!pkg) back("error", "That package no longer exists.");
  const all = await listAllPackages();
  const slugs = new Set(all.map((p) => p.slug));
  const codes = new Set(all.map((p) => p.code));
  let n = 1;
  const slugFor = (k: number) => `${pkg.slug}-copy${k > 1 ? `-${k}` : ""}`;
  const codeFor = (k: number) => `${pkg.code}-COPY${k > 1 ? k : ""}`;
  while (slugs.has(slugFor(n)) || codes.has(codeFor(n))) n++;
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { id: _id, minPrice: _m, availableMonths: _a, departureCities: _d, createdAt: _c, updatedAt: _u, departures: _dep, ...rest } = pkg;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const copy: PackageInput = { ...rest, slug: slugFor(n), code: codeFor(n), title: `${pkg.title} (copy)`, status: "draft", isFeatured: false };
  const newId = await savePackage(null, copy);
  revalidatePath("/admin");
  redirect(`/admin/packages/${newId}?copied=1`);
}

export async function deletePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idFrom(formData);
  const pkg = await getPackageById(id);
  if (!pkg) back("error", "That package no longer exists.");
  await deletePackage(id);
  revalidatePath("/admin");
  revalidatePath(`/package/${pkg.slug}`);
  revalidatePath("/");
  back("notice", `${pkg.title} was deleted.`);
}

export async function setEnquiryStatusAction(id: number, status: EnquiryStatus): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!Number.isInteger(id) || !["new", "contacted", "booked", "lost"].includes(status)) return { ok: false };
  await setEnquiryStatus(id, status);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
