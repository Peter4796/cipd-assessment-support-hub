/**
 * Central site configuration.
 * Update contact details, nav, and brand info here — every page reads from this.
 */

export const site = {
  name: "CIPD Assessment Support Hub",
  shortName: "CIPD Support Hub",
  tagline: "Professional CIPD Assessment Support for UK & UAE Learners",
  description:
    "Ethical CIPD assessment support, coaching, review and editing for Level 3, 5 and 7 learners across the UK and UAE. Brief analysis, structure, Harvard referencing and resubmission support.",
  url: "https://www.cipdguidance.com",
  locale: "en-GB",

  // ─── Contact details (placeholders — swap for live values) ───
  contact: {
    // International format without spaces or "+" for the wa.me link
    whatsappNumber: "447000000000",
    whatsappDisplay: "+44 7000 000000",
    email: "hello@cipdsupporthub.example.com",
    // Optional secondary/UAE line
    whatsappUaeNumber: "971500000000",
    whatsappUaeDisplay: "+971 50 000 0000",
  },

  markets: ["United Kingdom", "United Arab Emirates"],
} as const;

/**
 * Build a pre-filled WhatsApp click-to-chat link.
 */
export function whatsappLink(
  message = "Hi, I'd like help with my CIPD assessment.",
  number: string = site.contact.whatsappNumber
) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a mailto link with subject + body.
 */
export function emailLink(
  subject = "CIPD Assessment Support enquiry",
  body = ""
) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${site.contact.email}${qs ? `?${qs}` : ""}`;
}

// ─── Primary navigation ───
export type NavItem = { label: string; href: string; children?: NavItem[] };

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "All Services", href: "/services" },
      { label: "CIPD Level 3 Support", href: "/cipd-level-3-support" },
      { label: "CIPD Level 5 Support", href: "/cipd-level-5-support" },
      { label: "CIPD Level 7 Support", href: "/cipd-level-7-support" },
    ],
  },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Samples", href: "/samples" },
  { label: "FAQ", href: "/faq" },
];

// ─── Footer navigation groups ───
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Support Levels",
    items: [
      { label: "CIPD Level 3 Support", href: "/cipd-level-3-support" },
      { label: "CIPD Level 5 Support", href: "/cipd-level-5-support" },
      { label: "CIPD Level 7 Support", href: "/cipd-level-7-support" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Services", href: "/services" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Samples & Work Quality", href: "/samples" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

// Reusable CTA copy
export const cta = {
  sendBrief: "Send Your Assessment Brief",
  getQuote: "Get a Free Quote",
  whatsapp: "Chat on WhatsApp",
  requestQuote: "Request a Quote",
} as const;

// Ethical integrity statement — reused across the site
export const integrityNotice =
  "We provide academic guidance, editing, coaching and review support. All work should be used responsibly and in line with your study centre's academic integrity policy.";
