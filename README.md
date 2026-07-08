# CIPD Assessment Support Hub

A premium, conversion-focused website for an ethical CIPD assessment support, coaching,
review and editing service — targeting learners in the **UK & UAE** across CIPD **Level 3,
5 and 7**.

Built with **Next.js 14 (App Router)**, **TypeScript** and **Tailwind CSS**. Content is
data-driven so the site expands into Phases 2 & 3 without a redesign.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

---

## Positioning & compliance (important)

This site presents an **ethical academic support** service — guidance, coaching, review,
editing, structure, referencing and resubmission support. It **never** promises guaranteed
grades or offers to "write your assignment for you". The integrity statement lives in one
place (`src/lib/site.ts → integrityNotice`) and is reused across the site. Keep this tone
in all future copy.

---

## Project structure

```
src/
├── app/                      # Routes (App Router). One folder per page.
│   ├── layout.tsx            # Root layout: fonts, metadata, Header/Footer/WhatsApp float
│   ├── page.tsx              # Home
│   ├── about/
│   ├── services/
│   ├── cipd-level-3-support/ # Level pages are thin wrappers over <LevelPage/>
│   ├── cipd-level-5-support/
│   ├── cipd-level-7-support/
│   ├── how-it-works/
│   ├── pricing/
│   ├── samples/
│   ├── faq/
│   ├── contact/
│   ├── sitemap.ts            # SEO sitemap (add new routes here)
│   ├── robots.ts
│   └── globals.css           # Design-system layer (buttons, cards, sections)
│
├── components/               # Reusable UI
│   ├── Header.tsx            # Sticky nav + mobile menu (client)
│   ├── Footer.tsx
│   ├── WhatsAppFloat.tsx     # Persistent conversion button
│   ├── PageHero.tsx          # Standard inner-page hero
│   ├── Cta.tsx               # Reusable conversion band
│   ├── ui.tsx                # ButtonLink, Section, SectionHeading, CheckList
│   ├── Icon.tsx              # Inline SVG icon set
│   ├── Accordion.tsx         # FAQ accordion (client)
│   ├── LevelPage.tsx         # Shared template for the 3 level pages
│   └── EnquiryForm.tsx       # Contact/quote form (client)
│
├── content/                  # ★ Edit copy here — no component changes needed
│   ├── services.ts           # Services + "why choose us"
│   ├── levels.ts             # Level 3/5/7 content
│   └── site-content.ts       # Problem points, How It Works, Pricing, Samples, FAQ
│
└── lib/
    └── site.ts               # ★ Brand, contact details, nav, CTAs, integrity notice
```

### Where to change things

| I want to…                          | Edit                                             |
| ----------------------------------- | ------------------------------------------------ |
| Update WhatsApp number / email      | `src/lib/site.ts → site.contact`                 |
| Add / reorder nav items             | `src/lib/site.ts → primaryNav / footerNav`       |
| Change service or level copy        | `src/content/*.ts`                               |
| Adjust brand colours / fonts        | `tailwind.config.ts`, `src/app/globals.css`      |
| Add a new page                      | new folder in `src/app/…`, then add to `sitemap.ts` |

---

## Design system

- **Colours:** deep **navy** (primary), **gold** + **teal** accents, **mist** light greys,
  white. Defined as Tailwind scales in `tailwind.config.ts`.
- **Fonts:** Plus Jakarta Sans (display/headings) + Inter (body), via `next/font/google`.
- **Primitives:** `.btn-*`, `.card`, `.section`, `.container-px`, `.eyebrow`, `.chip` in
  `globals.css`. Compose these instead of re-styling from scratch.

---

## Conversion features (Phase 1)

- Dual hero CTAs — "Send Your Assessment Brief" + "Get a Free Quote"
- Persistent floating WhatsApp button + header WhatsApp/quote buttons
- Trust strip, problem→solution framing, level cards, "why choose us"
- Multi-field enquiry form (name, country, level, unit code, deadline, word count, help
  type, file upload, message) that composes a pre-filled WhatsApp **or** email enquiry
- Reusable `<CtaBand/>` closing every page
- FAQ page emits `FAQPage` JSON-LD for rich results; SEO keywords woven through copy

---

## Phase 2 — Authority & SEO (ready to add, no redesign needed)

The content-driven structure is built to extend:

1. **Blog** — add `src/app/blog/[slug]/page.tsx` + `src/content/blog.ts` (or MDX). The
   `.rich-text` styles in `globals.css` already style long-form articles. Add `/blog` to
   `primaryNav` and `sitemap.ts`.
2. **Resource hub & downloadable checklist** — `src/app/resources/`, reuse cards + CtaBand.
3. **Lead magnet** ("Free CIPD Assessment Planning Checklist") — reuse `EnquiryForm`
   pattern with the gated fields (Name, Email, CIPD level, Country, Deadline).
4. **Case-study pages** — `src/app/case-studies/[slug]/` using the same section components.

Blog topics, lead-magnet fields and case-study outlines from the brief map directly onto
these routes.

## Phase 3 — Client portal & automation (planned)

Structure anticipates it:

- **Auth + client dashboard** — new `src/app/(portal)/` route group.
- **EnquiryForm** already has a single `handleSubmit` hook — swap the WhatsApp/email compose
  for a `POST` to an API route / CRM / Supabase.
- **Admin dashboard, status tracking, secure payments, email notifications** — add as
  route groups + API routes; the design system and components carry straight over.

---

## Notes

- Contact details, links and the domain (`site.url`) are **placeholders** — update in
  `src/lib/site.ts` before launch.
- Independent service — not affiliated with or endorsed by the CIPD (stated in the footer).
