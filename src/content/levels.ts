/**
 * CIPD level content — powers the level cards on Home and the three level pages.
 */

export type Level = {
  slug: string;
  number: "3" | "5" | "7";
  name: string; // e.g. "Foundation Certificate"
  title: string; // page/card title
  audience: string;
  summary: string; // short, for cards
  intro: string; // opening paragraph on the level page
  who: string[]; // "who this is for" bullets
  focus: { title: string; description: string }[]; // key focus areas
  help: string[]; // how we help at this level
  seoKeyword: string;
};

export const levels: Level[] = [
  {
    slug: "cipd-level-3-support",
    number: "3",
    name: "Foundation Certificate & Diploma",
    title: "CIPD Level 3 Foundation Support",
    audience: "New to HR, HR assistants & admin professionals",
    summary:
      "Supportive, straightforward guidance for learners starting their people-practice journey.",
    intro:
      "CIPD Level 3 is the Foundation level — the starting point for many HR and people-practice careers. If you're new to academic writing or returning to study, the briefs, command verbs and referencing rules can feel unfamiliar. Our CIPD Level 3 assessment support keeps things clear, supportive and jargon-free so you can build confidence with every unit.",
    who: [
      "HR assistants and administrators new to people practice",
      "Career changers moving into HR",
      "Learners who are new to academic writing or referencing",
      "Anyone who wants a supportive, step-by-step approach",
    ],
    focus: [
      {
        title: "Understanding the basics",
        description:
          "We help you get comfortable with assessment briefs, command verbs and what each task is really asking.",
      },
      {
        title: "Clear, simple structure",
        description:
          "Straightforward structures and outlines so your answers stay focused and easy to follow.",
      },
      {
        title: "Referencing made simple",
        description:
          "Gentle, practical Harvard referencing guidance so you build good habits from the start.",
      },
      {
        title: "Confidence with writing",
        description:
          "Editing and proofreading support that helps your professional voice come through clearly.",
      },
    ],
    help: [
      "Plain-English breakdown of your Level 3 assessment brief",
      "Simple planning templates and outlines",
      "Draft review with supportive, encouraging feedback",
      "Harvard referencing basics and examples",
      "Proofreading for clarity, spelling and grammar",
      "Resubmission guidance if you've been referred",
    ],
    seoKeyword: "CIPD Level 3 assessment support",
  },
  {
    slug: "cipd-level-5-support",
    number: "5",
    name: "Associate Diploma",
    title: "CIPD Level 5 Associate Diploma Support",
    audience: "HR officers, advisors & people managers",
    summary:
      "Evidence-based, applied guidance for working HR professionals building deeper capability.",
    intro:
      "CIPD Level 5 is the Associate Diploma — the equivalent of undergraduate-level study and the most popular qualification for practising HR professionals. Level 5 expects evidence-based practice, analysis and application to your organisation. Our CIPD Level 5 assignment guidance helps you demonstrate that depth while managing a full-time role.",
    who: [
      "HR officers and HR advisors",
      "People managers and team leaders",
      "Working professionals studying alongside their job",
      "Learners moving up from Level 3",
    ],
    focus: [
      {
        title: "Evidence-based practice",
        description:
          "We help you support arguments with data, models and credible sources rather than opinion.",
      },
      {
        title: "Organisational performance",
        description:
          "Guidance on linking people practice to organisational performance and culture.",
      },
      {
        title: "Employee relations & behaviours",
        description:
          "Applying professional behaviours, employee relations and ethical practice to real scenarios.",
      },
      {
        title: "Applied HR analysis",
        description:
          "Moving beyond description to genuine analysis and workplace application that meets the criteria.",
      },
    ],
    help: [
      "Detailed brief interpretation and criteria mapping",
      "Structured plans that balance analysis and application",
      "Draft review focused on depth, evidence and criteria",
      "Harvard referencing for journals, models and CIPD sources",
      "Workplace-example coaching to strengthen application",
      "Resubmission support that targets referred criteria",
    ],
    seoKeyword: "CIPD Level 5 assignment guidance",
  },
  {
    slug: "cipd-level-7-support",
    number: "7",
    name: "Advanced Diploma",
    title: "CIPD Level 7 Advanced Diploma Support",
    audience: "Senior & strategic HR professionals",
    summary:
      "Critical, strategic and academically rigorous support at postgraduate level.",
    intro:
      "CIPD Level 7 is the Advanced Diploma — postgraduate-level study for senior and strategic people professionals. Level 7 demands critical analysis, wider reading, strategic thinking and a strong academic argument. Our CIPD Level 7 assessment review helps you meet that intellectual bar with confidence and clarity.",
    who: [
      "HR managers and senior people professionals",
      "Strategic and business-partner HR roles",
      "Postgraduate-level candidates",
      "Learners aiming for Chartered membership",
    ],
    focus: [
      {
        title: "Critical analysis",
        description:
          "We help you evaluate, compare and critique evidence rather than simply describe it.",
      },
      {
        title: "Strategic HR thinking",
        description:
          "Connecting people strategy to organisational strategy, context and stakeholder value.",
      },
      {
        title: "Academic depth & wider reading",
        description:
          "Integrating journals, theory and current research to build a credible, well-read argument.",
      },
      {
        title: "Professional argumentation",
        description:
          "Building a coherent, persuasive line of reasoning that holds up to postgraduate scrutiny.",
      },
    ],
    help: [
      "In-depth brief and criteria analysis at Master's level",
      "Structuring complex, argument-led responses",
      "Critical-review feedback on drafts and reasoning",
      "Advanced Harvard referencing and source integration",
      "Guidance on wider reading and literature use",
      "Resubmission support for referred Level 7 units",
    ],
    seoKeyword: "CIPD Level 7 assessment review",
  },
];

export function getLevel(slug: string) {
  return levels.find((l) => l.slug === slug);
}
