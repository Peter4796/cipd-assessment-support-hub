/**
 * Central site configuration.
 * Update contact details, nav, and brand info here — every page reads from this.
 */

export const site = {
  name: "CIPD Guidance",
  shortName: "CIPD Guidance",
  tagline: "Professional CIPD Assessment Support for UK & UAE Learners",
  description:
    "Ethical CIPD assessment support, coaching, review and editing for Level 3, 5 and 7 learners across the UK and UAE. Brief analysis, structure, Harvard referencing and resubmission support.",
  url: "https://www.cipdguidance.com",
  locale: "en-GB",

  // ─── Contact details (placeholders — swap for live values) ───
  contact: {
    // International format without spaces or "+" for the wa.me link
    whatsappNumber: "19176191130",
    whatsappDisplay: "+1 (917) 619-1130",
    // NOTE: mailbox not created yet — set up hello@cipdguidance.com to receive mail
    email: "hello@cipdguidance.com",
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
      { label: "CIPD Units (by code)", href: "/cipd-units" },
    ],
  },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Resource Hub", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Free Checklist", href: "/resources/cipd-assessment-planning-checklist" },
      { label: "Samples", href: "/samples" },
    ],
  },
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
      { label: "Support by Unit Code", href: "/cipd-units" },
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
    title: "Resources",
    items: [
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Free Checklist", href: "/resources/cipd-assessment-planning-checklist" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Client Portal", href: "/portal/login" },
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
