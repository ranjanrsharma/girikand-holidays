import type { MetadataRoute } from "next";
import { listPublishedSlugs } from "@/lib/packages";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const slugs = await listPublishedSlugs();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/holidays`, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({ url: `${base}/package/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
