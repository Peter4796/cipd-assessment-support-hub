/**
 * Shared page content: How It Works, Pricing, FAQ, Samples, Problem points, Trust strip.
 */

// ─── Trust strip (Home) ───
export const trustPoints = [
  "Clients across the UK, Gulf & worldwide",
  "CIPD Level 3, 5 & 7",
  "Harvard referencing support",
  "Assessment-criteria focused",
  "Confidential support",
];

// ─── Problem section (Home) ───
export const problemPoints: { title: string; description: string }[] = [
  {
    title: "Unclear assessment briefs",
    description:
      "Dense wording and command verbs like 'analyse', 'evaluate' and 'justify' that are hard to decode.",
  },
  {
    title: "Tight deadlines",
    description:
      "Juggling a full-time role, life and study with a submission date creeping closer.",
  },
  {
    title: "Word-count pressure",
    description:
      "Saying enough to meet the criteria without going far over, or under, the limit.",
  },
  {
    title: "Referencing & citations",
    description:
      "Getting Harvard in-text citations and reference lists right and consistent throughout.",
  },
  {
    title: "Resubmissions & referrals",
    description:
      "Feedback that isn't clear, and uncertainty about what a resubmission actually needs.",
  },
  {
    title: "Applying theory to practice",
    description:
      "Connecting HR models and theory to real workplace examples in a way that earns marks.",
  },
];

// ─── How It Works ───
export const howItWorksSteps: { step: number; title: string; description: string }[] = [
  {
    step: 1,
    title: "Send your brief",
    description:
      "Share your assessment brief, deadline, word count and any tutor feedback you already have. The more detail, the better we can help.",
  },
  {
    step: 2,
    title: "Receive a clear quote & plan",
    description:
      "We review what you need and send a transparent quote with a simple support plan, with no obligation and no surprises.",
  },
  {
    step: 3,
    title: "Get structured guidance",
    description:
      "You receive tailored support: brief analysis, structure, research direction, draft review or editing, whatever your package covers.",
  },
  {
    step: 4,
    title: "Review & request refinements",
    description:
      "Look over the guidance and feedback, ask questions and request refinements until you're confident in your direction.",
  },
  {
    step: 5,
    title: "Submit confidently",
    description:
      "Make your final edits, complete your own review, and submit your work with clarity and confidence.",
  },
];

// ─── Pricing packages (no fixed prices; quote-based) ───
export const pricingPackages: {
  name: string;
  best: string;
  description: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    name: "Brief Review & Structure",
    best: "Understand the question & plan the answer",
    description:
      "Ideal if you're at the start and want to be certain you've understood the brief before you write.",
    features: [
      "Full assessment brief interpretation",
      "Learning outcome & criteria mapping",
      "Recommended structure and outline",
      "Word-count allocation per task",
      "A short guidance call or written summary",
    ],
  },
  {
    name: "Draft Review & Improvement",
    best: "Already have a draft & want it stronger",
    description:
      "For learners with a working draft who want detailed, criteria-focused feedback to improve it.",
    features: [
      "Detailed review of your existing draft",
      "Criteria-by-criteria feedback",
      "Suggestions for depth, clarity and application",
      "Harvard referencing check and guidance",
      "Editing and proofreading pass",
    ],
    featured: true,
  },
  {
    name: "Full Assessment Guidance Package",
    best: "Deeper support from brief to final review",
    description:
      "End-to-end guidance for learners who want structured support at every stage of the assessment.",
    features: [
      "Everything in the first two packages",
      "Ongoing guidance from brief to final draft",
      "Research direction and source suggestions",
      "Workplace-application coaching",
      "Priority responses around your deadline",
    ],
  },
];

// ─── Samples / Work Quality ───
export const samples: {
  id: string;
  label: string;
  title: string;
  intro: string;
  body: string; // rendered as pre-formatted / rich block
}[] = [
  {
    id: "introduction",
    label: "Example introduction",
    title: "How a strong CIPD introduction reads",
    intro:
      "A focused introduction sets scope, signposts structure and shows the assessor you understand the task. Here is the style and standard we help you reach.",
    body: "This report examines the relationship between people practices and organisational performance within a mid-sized professional-services firm. It first outlines the strategic context in which the HR function operates, before analysing how evidence-based approaches to resourcing and reward influence employee engagement and, in turn, organisational outcomes. Drawing on established models and relevant academic literature, the discussion applies theory to a live workplace example and concludes with practical, criteria-aligned recommendations for people professionals.",
  },
  {
    id: "criteria-mapping",
    label: "Assessment-criteria mapping",
    title: "Example criteria mapping table",
    intro:
      "Mapping each task to its assessment criteria keeps a response complete and focused. We help you build tables like this so nothing is missed.",
    body: "TABLE",
  },
  {
    id: "referencing",
    label: "Harvard reference formatting",
    title: "Example Harvard reference formatting",
    intro:
      "Correct, consistent Harvard referencing protects easy marks. These examples show the formatting standard we help you achieve.",
    body: "Armstrong, M. and Taylor, S. (2023) Armstrong's Handbook of Human Resource Management Practice. 16th edn. London: Kogan Page.\n\nCIPD (2024) Evidence-based practice for effective decision-making. [online] London: Chartered Institute of Personnel and Development. Available at: https://www.cipd.org [Accessed 12 May 2024].\n\nGuest, D.E. (2017) 'Human resource management and employee well-being: towards a new analytic framework', Human Resource Management Journal, 27(1), pp. 22–38.",
  },
  {
    id: "feedback-note",
    label: "Tutor-feedback improvement note",
    title: "Example tutor-feedback improvement note",
    intro:
      "When you're referred, feedback can be hard to action. We translate it into clear, practical improvements like the note below.",
    body: "Tutor comment: 'AC 2.1 not yet met, more analysis needed.'\n\nWhat this means: The response currently describes the two reward approaches but does not compare their strengths, limitations or suitability for the organisation.\n\nHow to improve: Add a short comparative paragraph that weighs each approach against the organisation's context, supported by one credible source, and state which is more appropriate and why. This moves the answer from description to the analysis AC 2.1 requires.",
  },
];

// ─── FAQ ───
export const faqs: { question: string; answer: string }[] = [
  {
    question: "Do you support CIPD Level 3, 5 and 7?",
    answer:
      "Yes. We provide assessment support across all three levels (Level 3 Foundation, Level 5 Associate Diploma and Level 7 Advanced Diploma), with guidance tailored to the depth each level expects.",
  },
  {
    question: "Do you work with UK learners?",
    answer:
      "Absolutely. Many of our learners are based in the UK, and our support is aligned with UK-style academic expectations and Harvard referencing conventions.",
  },
  {
    question: "Do you support learners outside the UK?",
    answer:
      "Yes. We work with CIPD learners worldwide. Study centres set their own briefs, but the qualifications and assessment standards are the same wherever you study, and everything runs over WhatsApp and email in your time zone.",
  },
  {
    question: "Do you work with UAE learners?",
    answer:
      "Yes. We regularly support learners across the UAE and the wider Gulf who are studying CIPD through local and international study centres. We work across time zones and reply quickly on WhatsApp and email.",
  },
  {
    question: "Can you help with resubmissions?",
    answer:
      "Yes. Resubmission support is one of our most requested services. We interpret your tutor's feedback, identify exactly which criteria weren't met, and guide the improvements your resubmission needs.",
  },
  {
    question: "Can you review my draft?",
    answer:
      "Yes. Send us your draft and you'll receive detailed, criteria-focused feedback on structure, depth, clarity, application and referencing, with clear suggestions for improvement.",
  },
  {
    question: "Can you help with Harvard referencing?",
    answer:
      "Yes. We help you format in-text citations and reference lists correctly in Harvard style and show you how to cite CIPD sources, journals and models properly, which is an easy place to gain or lose marks.",
  },
  {
    question: "How fast can you help?",
    answer:
      "It depends on your word count and deadline, but we respond to enquiries quickly and often support learners working to tight timelines. Message us with your deadline and we'll tell you honestly what's realistic.",
  },
  {
    question: "Is the service confidential?",
    answer:
      "Completely. Your details, documents and enquiry are handled discreetly and never shared. Confidentiality and discretion are central to how we work.",
  },
  {
    question: "Do you guarantee a pass?",
    answer:
      "No, and you should be cautious of anyone who does. What we guarantee is high-quality support that improves your structure, clarity, referencing and alignment with the assessment criteria, so you can submit your strongest, most confident work.",
  },
];
