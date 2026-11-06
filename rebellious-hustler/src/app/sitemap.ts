import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({ where: { status: "LIVE" }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
  const staticPages = ["", "/shop", "/about", "/contact", "/delivery", "/returns", "/terms", "/privacy"].map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: new Date(),
    changeFrequency: (p === "" || p === "/shop" ? "daily" : "monthly") as "daily" | "monthly",
    priority: p === "" ? 1 : p === "/shop" ? 0.9 : 0.5,
  }));
  return [
    ...staticPages,
    ...products.map((p) => ({ url: `${baseUrl}/shop/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
