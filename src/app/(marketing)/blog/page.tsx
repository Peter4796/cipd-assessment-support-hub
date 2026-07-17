import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { postsByDate } from "@/content/posts";

export const metadata: Metadata = {
  title: "CIPD Assessment Blog: Guides & Tips",
  description:
    "Expert guides on CIPD assessments: understanding briefs, Harvard referencing, assignment structure, resubmissions, tutor feedback and managing deadlines for UK & UAE learners.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export default function BlogIndexPage() {
  const [featured, ...rest] = postsByDate;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        breadcrumb="Blog"
        title="CIPD assessment guides & insights"
        intro="Practical, ethical guidance on understanding briefs, referencing, structure, resubmissions and more, written for CIPD learners across the UK and UAE."
      />

      <Section tone="white">
        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="card card-hover group mb-10 grid gap-6 md:grid-cols-2 md:items-center"
        >
          <div className="order-2 md:order-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="chip border-teal-200 bg-teal-50 text-teal-700">{featured.category}</span>
              <span className="text-navy-400">
                {formatDate(featured.date)} · {featured.readMinutes} min read
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-navy-900 group-hover:text-gold-600">
              {featured.title}
            </h2>
            <p className="mt-3 body-copy text-sm">{featured.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 group-hover:gap-2.5">
              Read article <Icon name="arrow" className="h-4 w-4" />
            </span>
          </div>
          <div className="order-1 flex aspect-[16/10] items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 md:order-2">
            <span className="text-6xl font-bold text-gold-400/90">CIPD</span>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-hover group flex flex-col">
              <div className="flex items-center gap-2 text-xs">
                <span className="chip border-mist-300 bg-mist-50">{post.category}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-navy-900 group-hover:text-gold-600">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 body-copy text-sm">{post.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-navy-400">
                <span>{formatDate(post.date)}</span>
                <span>{post.readMinutes} min read</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
