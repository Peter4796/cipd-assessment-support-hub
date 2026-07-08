/**
 * Services content — reused on the Home overview and the full Services page.
 */

export type Service = {
  slug: string;
  title: string;
  short: string; // one-line for home overview
  description: string; // fuller copy for services page
  icon: IconName;
};

export type IconName =
  | "brief"
  | "map"
  | "structure"
  | "research"
  | "review"
  | "edit"
  | "reference"
  | "resubmit"
  | "feedback"
  | "coaching"
  | "originality";

// Compact list shown in the Home "Services overview" grid
export const homeServices: { title: string; short: string; icon: IconName }[] = [
  { title: "Brief analysis", short: "Decode exactly what your assessment is asking.", icon: "brief" },
  { title: "Assignment planning", short: "Map a clear plan against every task.", icon: "map" },
  { title: "Structure & outline", short: "Build a logical, criteria-led structure.", icon: "structure" },
  { title: "Research guidance", short: "Find credible, relevant academic sources.", icon: "research" },
  { title: "Draft review", short: "Detailed feedback to strengthen your draft.", icon: "review" },
  { title: "Editing & proofreading", short: "Polish clarity, grammar and flow.", icon: "edit" },
  { title: "Harvard referencing", short: "Accurate citations and reference lists.", icon: "reference" },
  { title: "Resubmission improvement", short: "Turn tutor feedback into a stronger resubmission.", icon: "resubmit" },
  { title: "Feedback interpretation", short: "Understand what your tutor really wants.", icon: "feedback" },
];

// Full service sections for the Services page
export const services: Service[] = [
  {
    slug: "assessment-brief-interpretation",
    title: "Assessment brief interpretation",
    short: "Understand exactly what your brief is asking.",
    description:
      "We break down your CIPD assessment brief line by line — command verbs, tasks, word counts and what each question is really asking. You get a plain-English summary so you know exactly what a strong response needs to cover before you write a word.",
    icon: "brief",
  },
  {
    slug: "learning-outcome-mapping",
    title: "Learning outcome & assessment criteria mapping",
    short: "Align every point to the marking criteria.",
    description:
      "Every CIPD unit is marked against specific learning outcomes and assessment criteria. We map your tasks to each criterion so nothing is missed, showing you where marks are won and how to evidence each requirement clearly.",
    icon: "map",
  },
  {
    slug: "assignment-structure-planning",
    title: "Assignment structure & planning",
    short: "A logical plan and outline to write against.",
    description:
      "We help you build a clear, professional structure — headings, sub-sections, and a word-count allocation for each task. A strong plan keeps your response focused, balanced and easy for an assessor to follow.",
    icon: "structure",
  },
  {
    slug: "draft-review-improvement",
    title: "Draft review & improvement",
    short: "Actionable feedback to raise your draft.",
    description:
      "Send us your draft and receive detailed, constructive feedback: where your argument is strong, where criteria aren't yet met, and specific suggestions to improve depth, clarity and application to practice.",
    icon: "review",
  },
  {
    slug: "editing-proofreading",
    title: "Editing & proofreading",
    short: "Clear, professional, error-free writing.",
    description:
      "We refine grammar, punctuation, tone and readability so your work reads with the professional, academic voice CIPD expects — without changing your ideas or your authentic argument.",
    icon: "edit",
  },
  {
    slug: "harvard-referencing-support",
    title: "Harvard referencing support",
    short: "Accurate in-text citations and reference lists.",
    description:
      "Referencing is where many submissions lose easy marks. We help you format in-text citations and full reference lists correctly in Harvard style, and show you how to cite CIPD sources, journals and models properly.",
    icon: "reference",
  },
  {
    slug: "resubmission-support",
    title: "Resubmission support",
    short: "Turn a referral into a confident resubmission.",
    description:
      "A referral isn't the end of the road. We interpret your tutor's feedback, pinpoint exactly which criteria weren't met, and guide the improvements needed so your resubmission clearly addresses every point.",
    icon: "resubmit",
  },
  {
    slug: "hr-theory-workplace-guidance",
    title: "HR theory & workplace example guidance",
    short: "Apply models and theory to real practice.",
    description:
      "CIPD rewards application, not just description. We help you connect HR theory, models and wider reading to relevant workplace examples so your answers demonstrate genuine people-practice insight.",
    icon: "coaching",
  },
  {
    slug: "originality-plagiarism-reduction",
    title: "Turnitin & plagiarism-risk reduction",
    short: "Stronger originality through better practice.",
    description:
      "We coach you on originality, effective paraphrasing and correct citation so your work reflects your own understanding and reduces plagiarism risk. This is guidance on good academic practice — not a way to disguise unoriginal work.",
    icon: "originality",
  },
];

// "Why choose us" — reused on Home and About
export const whyChooseUs: { title: string; description: string }[] = [
  {
    title: "Assessment-criteria alignment",
    description:
      "Everything we do maps back to your unit's learning outcomes and marking criteria, so your effort lands where the marks are.",
  },
  {
    title: "Clear structure",
    description:
      "We help you organise complex material into a logical, readable response an assessor can follow with ease.",
  },
  {
    title: "Professional HR language",
    description:
      "Your work reads with the confident, professional voice expected of a people-practice professional.",
  },
  {
    title: "Practical workplace application",
    description:
      "We help you connect theory to real organisational examples — the difference between a pass and a strong pass.",
  },
  {
    title: "Confidential communication",
    description:
      "Your details, documents and enquiry are handled discreetly and never shared. Privacy is built in.",
  },
  {
    title: "Fast response",
    description:
      "Working around a deadline? We reply quickly on WhatsApp and email and work to realistic timelines.",
  },
];
