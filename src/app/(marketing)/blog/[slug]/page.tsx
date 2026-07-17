import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { RichContent } from "@/components/RichContent";
import { posts, getPost, relatedWithClusterFallback } from "@/content/posts";
import { magnetForPillar, resolvePillar } from "@/content/pillars";
import { getUnit } from "@/content/units";
import { enquiryUrl, type EnquiryContext } from "@/lib/leads/context";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, faqPairsFromBlocks, ORGANIZATION_ID } from "@/lib/schema";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: [post.keyword],
    alternates: { canonical: `${site.url}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
    },
  };
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  // Curated related links topped up with cluster siblings (Part 7 fallback).
  const related = relatedWithClusterFallback(post);
  const pillarTarget = resolvePillar(post.pillar, (slug) => getPost(slug)?.title);
  const magnet = magnetForPillar(post.pillar);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  // FAQ-pattern articles (### question / paragraph answers) earn FAQPage
  // rich-result markup; derivation returns [] for everything else.
  const faqPairs = post.slug.endsWith("-faqs") ? faqPairsFromBlocks(post.body) : [];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      {faqPairs.length >= 3 && <JsonLd data={faqJsonLd(faqPairs)} />}
      <JsonLd data={articleJsonLd} />
      <PageHero
        eyebrow={post.category}
        breadcrumb="Blog"
        title={post.title}
        intro={post.description}
      >
        <p className="text-sm text-navy-300">
          {formatDate(post.date)} · {post.readMinutes} min read
        </p>
      </PageHero>

      <Section tone="white">
        <div className="mx-auto max-w-3xl">
          {/* Unit pillar banner */}
          {post.unit && getUnit(post.unit.toLowerCase()) ? (
            <Link
              href={`/cipd-units/${post.unit.toLowerCase()}`}
              className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 transition-colors hover:border-teal-300"
            >
              <span className="text-sm text-navy-700">
                Part of our complete{" "}
                <span className="font-semibold text-navy-900">{post.unit} guide</span>. See all{" "}
                {post.unit} support and guides.
              </span>
              <Icon name="arrow" className="h-5 w-5 flex-none text-teal-600" />
            </Link>
          ) : (
            // Non-unit clusters: the "up" link to the pillar (Part 7). A hub
            // article resolves to itself, so it renders no banner.
            pillarTarget &&
            pillarTarget.href !== `/blog/${post.slug}` && (
              <Link
                href={pillarTarget.href}
                className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 transition-colors hover:border-teal-300"
              >
                <span className="text-sm text-navy-700">
                  Part of our{" "}
                  <span className="font-semibold text-navy-900">{pillarTarget.label}</span>{" "}
                  series. See the full guide.
                </span>
                <Icon name="arrow" className="h-5 w-5 flex-none text-teal-600" />
              </Link>
            )
          )}

          <RichContent blocks={post.body} />

          {/* Cluster lead magnet (Part 9): rendered from the pillar mapping,
              never hand-coded per article. */}
          {magnet && (
            <Link
              href={magnet.href}
              className="mt-10 flex items-start gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-5 transition-colors hover:border-gold-300"
            >
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gold-500 text-white">
                <Icon name="download" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-bold text-navy-900">{magnet.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-navy-600">
                  {magnet.description}
                </span>
              </span>
            </Link>
          )}

          {/* Back link */}
          <div className="mt-10 border-t border-mist-200 pt-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" /> Back to all articles
            </Link>
          </div>
        </div>
      </Section>

      {/* Related */}
      {related.length > 0 && (
        <Section tone="mist">
          <h2 className="mb-8 text-2xl font-bold text-navy-900">Related reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="card card-hover group flex flex-col">
                <span className="chip border-mist-300 bg-white text-navy-600">{r.category}</span>
                <h3 className="mt-3 text-base font-bold text-navy-900 group-hover:text-gold-600">
                  {r.title}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                  Read <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <CtaBand location="article" primaryHref={enquiryUrl(articleCtaContext(post))} />
    </>
  );
}

/**
 * Contextual funnel prefill from article topic (P1.10). Only unambiguous
 * categories prefill a support type; everything else sends no assumption.
 */
function articleCtaContext(post: { category: string; unit?: string }): EnquiryContext {
  const ctx: EnquiryContext = { cta: "article_end" };
  if (post.unit && /^[357][A-Za-z]{2}\d{2}$/.test(post.unit)) {
    ctx.unit = post.unit;
    ctx.level = post.unit[0] as EnquiryContext["level"];
  }
  switch (post.category) {
    case "Referencing":
      ctx.support = "harvard_referencing";
      break;
    case "Feedback":
      ctx.support = "feedback_interpretation";
      break;
    case "Resubmissions":
      ctx.support = "resubmission";
      ctx.submission = "resubmission";
      break;
  }
  return ctx;
}
