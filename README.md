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

## Phase 2 — Authority & SEO ✅ built

- **Blog** — `/blog` + `/blog/[slug]`, content in `src/content/blog.ts`, rendered by
  `RichContent` with Article JSON-LD and related-post linking.
- **Resource hub** — `/resources`, tying blog, checklist and case studies together.
- **Lead magnet** — `/resources/cipd-assessment-planning-checklist` (`LeadMagnetForm`) with
  gated fields (Name, Email, CIPD level, Country, Deadline) → printable file in
  `public/downloads/`.
- **Case studies** — `/case-studies` + `/case-studies/[slug]`, content in
  `src/content/case-studies.ts`.

Add a post/case study by appending to the relevant `src/content/*.ts` file — routes and the
sitemap pick it up automatically.

## Phase 3 — Client portal & automation ✅ built (demo mode)

A full client portal and admin dashboard, running on a **swappable demo backend** so it's
interactive out of the box. **Nothing here is production-secure yet** — see "Going live".

### Routes
| Area | Route | Notes |
|------|-------|-------|
| Client login | `/portal/login` | Demo sign-in (no password). Linked from the footer. |
| Client dashboard | `/portal` | Projects, stats, "needs attention". |
| New request | `/portal/new` | Submit a brief → **instant automated estimate**. |
| Project detail | `/portal/[id]` | Status tracker, quote approve, **pay (demo)**, file downloads, request revision, messages, activity. |
| Admin login | `/admin/login` | Passcode gate. Demo code: `cipd-admin`. |
| Admin dashboard | `/admin` | All enquiries, **filter by country / level / deadline / status**, search. |
| Admin project | `/admin/[id]` | Set status, send quote (auto-suggested), upload deliverables, notes (client/internal), email update, WhatsApp client. |
| Quote API | `POST /api/quote` | Real serverless endpoint: `{level, wordCount, helpType, deadline}` → estimate. |

### Architecture
- **Layouts** — marketing pages live in the `(marketing)` route group (header/footer/WhatsApp
  float). `/portal` and `/admin` have their own app-shell chrome (`PortalTopbar`) and are
  `noindex` (also disallowed in `robots.ts`).
- **Data layer** — `src/lib/portal/store.ts` persists projects in `localStorage` and reacts
  via `useSyncExternalStore`, seeded from `src/lib/portal/seed.ts`. All UI consumes
  `useProjects()` / `useProject(id)` + mutation helpers, so swapping storage needs **no UI
  changes**.
- **Quote engine** — `src/lib/portal/quote.ts` (`estimateQuote`), pure function used by the
  portal, admin and `/api/quote`.
- **Auth** — `src/lib/portal/session.ts` is a **demo stub** (localStorage). Not secure.

### Going live (replace demo pieces with real services)
1. **Database** — create a Supabase/Postgres schema mirroring `src/lib/portal/types.ts`.
   Move `store.ts` mutations behind API routes (`/api/projects/...`).
2. **Auth** — replace `session.ts` + the `RequireClient`/`RequireAdmin` gates with a real
   provider (Supabase Auth, Auth.js or Clerk). Protect `/admin` server-side (or add Vercel
   password protection immediately as a stopgap).
3. **Payments** — swap the `markPaid()` demo button for **Stripe Checkout** (create a session
   in an API route; confirm via webhook).
4. **File storage** — send the `File` objects from `FileDrop` to Supabase Storage / S3 and
   store the returned URLs on `FileRef`.
5. **Email/WhatsApp notifications** — from `/api/quote` and status changes, trigger
   transactional email (Resend/SendGrid) and optionally WhatsApp Business API.

See `.env.example` for the environment variables these integrations expect.

---

## Notes

- Contact details, links and the domain (`site.url`) are **placeholders** — update in
  `src/lib/site.ts` before launch.
- Independent service — not affiliated with or endorsed by the CIPD (stated in the footer).
