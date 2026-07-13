import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { RichContent } from "@/components/RichContent";
import { posts, getPost } from "@/content/blog";
import { getUnit } from "@/content/units";
import { site } from "@/lib/site";

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

  const related = post.related
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
          {post.unit && getUnit(post.unit.toLowerCase()) && (
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
          )}

          <RichContent blocks={post.body} />

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

      <CtaBand location="article" />
    </>
  );
}
