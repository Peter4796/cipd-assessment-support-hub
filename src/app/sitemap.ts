import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "",
  "/about",
  "/services",
  "/cipd-level-3-support",
  "/cipd-level-5-support",
  "/cipd-level-7-support",
  "/how-it-works",
  "/pricing",
  "/samples",
  "/faq",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Static build date — update on deploy or wire to CMS in Phase 2.
  const lastModified = new Date("2026-07-08");
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.includes("level") ? 0.9 : 0.7,
  }));
}
