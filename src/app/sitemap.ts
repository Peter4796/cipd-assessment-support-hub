import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { posts } from "@/content/blog";
import { caseStudies } from "@/content/case-studies";
import { units } from "@/content/units";

const staticRoutes = [
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
  "/resources",
  "/resources/cipd-assessment-planning-checklist",
  "/blog",
  "/case-studies",
  "/cipd-units",
  "/cipd-resubmission-support",
  "/send-your-brief",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Static build date — update on deploy or wire to CMS content dates.
  const lastModified = new Date("2026-07-08");

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.includes("level") ? 0.9 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const caseEntries: MetadataRoute.Sitemap = caseStudies.map((c) => ({
    url: `${site.url}/case-studies/${c.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const unitEntries: MetadataRoute.Sitemap = units.map((u) => ({
    url: `${site.url}/cipd-units/${u.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries, ...caseEntries, ...unitEntries];
}
