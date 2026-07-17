/**
 * Anonymised case studies that demonstrate the support process and outcomes.
 * All examples are illustrative and anonymised; no client-identifying detail.
 */

import type { Block } from "@/content/types";

export type CaseStudy = {
  slug: string;
  level: "3" | "5" | "7";
  title: string;
  summary: string;
  client: string; // anonymised descriptor
  challenge: string;
  supportType: string;
  outcome: string;
  body: Block[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "level-5-draft-improvement",
    level: "5",
    title: "Level 5 draft improvement: from description to analysis",
    summary:
      "How a working HR advisor turned a descriptive Level 5 draft into an analytical, criteria-aligned submission.",
    client: "HR advisor, UK · CIPD Level 5 Associate Diploma",
    challenge:
      "A strong draft that described HR models well but rarely analysed or applied them, putting several assessment criteria at risk.",
    supportType: "Draft review & improvement",
    outcome:
      "A restructured, analytical response with every criterion clearly evidenced, submitted with confidence.",
    body: [
      { type: "h2", text: "The situation" },
      {
        type: "p",
        text: "An HR advisor studying Level 5 alongside a full-time role sent us a near-complete draft. The writing was clear and the HR knowledge was sound, but on review the work was heavily descriptive. It explained concepts thoroughly but rarely analysed them or applied them to the organisation. At Level 5, that gap is a common cause of referral.",
      },
      { type: "h2", text: "What we did" },
      {
        type: "p",
        text: "We reviewed the draft against each assessment criterion and produced a criteria-by-criteria feedback note. For every point marked 'descriptive', we suggested how to move it towards analysis, comparing options, weighing suitability and reaching a judgement, and where a workplace example would demonstrate application.",
      },
      {
        type: "ul",
        items: [
          "Mapped the draft to every AC and flagged which were not yet fully met.",
          "Showed where description could become comparison and evaluation.",
          "Identified places to add a relevant workplace example.",
          "Checked Harvard referencing for consistency and completeness.",
        ],
      },
      { type: "h2", text: "The outcome" },
      {
        type: "callout",
        text: "The learner kept their authentic voice and argument. Our role was to guide the improvements, not to write the work.",
      },
      {
        type: "p",
        text: "With a clear action list, the advisor revised the draft themselves, adding analysis and application where it counted. The final submission addressed every criterion and read with the applied, evidence-based depth Level 5 expects.",
      },
    ],
  },
  {
    slug: "level-3-resubmission-support",
    level: "3",
    title: "Level 3 resubmission: decoding vague feedback",
    summary:
      "How a new people-practice learner turned an intimidating referral into a straightforward, targeted resubmission.",
    client: "HR assistant, UAE · CIPD Level 3 Foundation",
    challenge:
      "A first referral with feedback that felt vague and discouraging, and uncertainty about what the resubmission actually needed.",
    supportType: "Resubmission & feedback interpretation",
    outcome:
      "A clear, targeted action plan that addressed each referred criterion without rewriting the whole assignment.",
    body: [
      { type: "h2", text: "The situation" },
      {
        type: "p",
        text: "An HR assistant new to academic study received their first referral and felt overwhelmed. The tutor's comments, 'develop further' and 'AC not fully met', were hard to translate into action, and the learner was unsure whether they needed to start again.",
      },
      { type: "h2", text: "What we did" },
      {
        type: "p",
        text: "We interpreted the feedback line by line, tying each comment to a specific criterion and a specific place in the work. Crucially, we reassured the learner that most of the assignment had passed, and only a few targeted improvements were needed.",
      },
      {
        type: "ul",
        items: [
          "Translated each tutor comment into a plain-English, actionable step.",
          "Identified exactly which criteria were referred, and which had passed.",
          "Provided a supportive, step-by-step improvement plan.",
          "Reviewed the revised sections before resubmission.",
        ],
      },
      { type: "h2", text: "The outcome" },
      {
        type: "callout",
        text: "A referral rarely means starting over. Targeting the exact gaps is faster, less stressful and less risky than rewriting.",
      },
      {
        type: "p",
        text: "The learner resubmitted with a focused, confident set of improvements and, just as importantly, understood the feedback process well enough to approach future assignments with less anxiety.",
      },
    ],
  },
  {
    slug: "level-7-structure-and-critical-analysis",
    level: "7",
    title: "Level 7 structure & critical analysis support",
    summary:
      "How a senior HR manager brought postgraduate-level critical depth and a coherent structure to a demanding Level 7 assessment.",
    client: "HR manager, UK · CIPD Level 7 Advanced Diploma",
    challenge:
      "Strong ideas and wide reading, but a sprawling structure and analysis that described the literature rather than critiquing it.",
    supportType: "Structure & critical-analysis coaching",
    outcome:
      "A tightly argued, well-structured response demonstrating genuine critical evaluation and strategic thinking.",
    body: [
      { type: "h2", text: "The situation" },
      {
        type: "p",
        text: "A senior HR manager studying Level 7 had done extensive reading and had genuinely strong ideas, but the draft sprawled, and much of the 'analysis' summarised sources rather than critically evaluating them. At postgraduate level, that distinction is decisive.",
      },
      { type: "h2", text: "What we did" },
      {
        type: "p",
        text: "We worked on two fronts: structure and criticality. First, we helped shape a coherent line of argument with a structure that built logically towards a justified conclusion. Then we coached on how to move from summarising literature to genuinely critiquing it: comparing perspectives, questioning assumptions and evaluating evidence.",
      },
      {
        type: "ul",
        items: [
          "Reshaped the response around a clear, argument-led structure.",
          "Showed how to critique and compare sources rather than describe them.",
          "Strengthened the link between people strategy and organisational strategy.",
          "Advised on integrating wider reading into a persuasive argument.",
        ],
      },
      { type: "h2", text: "The outcome" },
      {
        type: "callout",
        text: "At Level 7, how you argue matters as much as what you know. Structure and criticality are where strong professionals earn strong marks.",
      },
      {
        type: "p",
        text: "The manager's revised submission read as a coherent, critically argued piece of postgraduate work: the same knowledge, but organised and evaluated in a way that met the demands of the Advanced Diploma.",
      },
    ],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
