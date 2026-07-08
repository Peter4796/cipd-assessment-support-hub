import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

/* ─── Button / Link buttons ─── */

type Variant = "primary" | "navy" | "outline" | "ghost-light" | "whatsapp";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  navy: "btn-navy",
  outline: "btn-outline",
  "ghost-light": "btn-ghost-light",
  whatsapp: "btn-whatsapp",
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  external = false,
  withArrow = false,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  external?: boolean;
  withArrow?: boolean;
}) {
  const cls = `${variantClass[variant]} ${className}`;
  const content = (
    <>
      {variant === "whatsapp" && <Icon name="whatsapp" className="h-4 w-4" />}
      {children}
      {withArrow && <Icon name="arrow" className="h-4 w-4" />}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}

/* ─── Section wrapper ─── */

export function Section({
  children,
  className = "",
  tone = "white",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "mist" | "navy";
  id?: string;
}) {
  const toneClass =
    tone === "mist" ? "bg-mist-100" : tone === "navy" ? "bg-navy-900 text-white" : "bg-white";
  return (
    <section id={id} className={`section ${toneClass} ${className}`}>
      <div className="container-px">{children}</div>
    </section>
  );
}

/* ─── Section heading ─── */

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  invert = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  invert?: boolean;
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"} ${
        align === "center" ? "mb-12" : "mb-10"
      }`}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2
        className={`text-3xl font-bold sm:text-4xl ${invert ? "text-white" : "text-navy-900"}`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${invert ? "text-navy-100" : "text-navy-600"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

/* ─── Feature check list ─── */

export function CheckList({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <span className="body-copy text-navy-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}
