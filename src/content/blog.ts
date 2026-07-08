/**
 * Blog content. Each post is a typed block array rendered by <RichContent/>.
 * Add a new post by appending to `posts` — the index, [slug] route and sitemap
 * pick it up automatically.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

export type Post = {
  slug: string;
  title: string;
  description: string; // meta description + card excerpt
  category: string;
  keyword: string; // primary SEO keyword
  date: string; // ISO
  readMinutes: number;
  body: Block[];
  related: string[]; // slugs
};

export const posts: Post[] = [
  {
    slug: "how-to-understand-a-cipd-assessment-brief",
    title: "How to Understand a CIPD Assessment Brief",
    description:
      "A step-by-step guide to decoding a CIPD assessment brief — command verbs, tasks, learning outcomes and word counts — so you know exactly what a strong answer needs.",
    category: "Getting started",
    keyword: "CIPD assessment brief guidance",
    date: "2026-07-08",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "The single biggest reason CIPD assignments lose marks isn't weak writing — it's answering a different question to the one that was asked. A CIPD assessment brief is a precise document, and learning to read it properly is the highest-value skill you can build. This guide walks you through how to decode a brief before you write a single word.",
      },
      { type: "h2", text: "Start with the learning outcomes and assessment criteria" },
      {
        type: "p",
        text: "Every CIPD unit is marked against specific learning outcomes (LOs) and assessment criteria (ACs). These are not background information — they are the exact checklist your assessor uses. Before anything else, list every AC and treat each one as a mini-question you must answer in full.",
      },
      {
        type: "callout",
        text: "Rule of thumb: if a criterion isn't clearly evidenced somewhere in your response, it hasn't been met — no matter how good the rest of the work is.",
      },
      { type: "h2", text: "Decode the command verbs" },
      {
        type: "p",
        text: "Command verbs tell you the depth of response required. Mixing them up is a common and costly mistake — 'explain' and 'evaluate' demand very different things.",
      },
      {
        type: "ul",
        items: [
          "Identify / list — state the relevant points briefly.",
          "Explain / describe — give reasons, detail and context.",
          "Analyse — break something into parts and examine how they relate.",
          "Evaluate / assess — weigh strengths and limitations and reach a judgement.",
          "Justify — give evidence and reasoning to support a position.",
        ],
      },
      {
        type: "p",
        text: "At Level 3, briefs lean towards 'explain' and 'describe'. At Level 5 you'll see more 'analyse' and 'assess'. At Level 7, 'critically evaluate' dominates. Match your depth to the verb.",
      },
      { type: "h2", text: "Map tasks to word count" },
      {
        type: "p",
        text: "Divide your total word count across the tasks in proportion to the marks or the number of criteria each covers. This stops you spending 800 words on an easy section and running out of room for the one that carries the most marks.",
      },
      { type: "h2", text: "Rewrite the brief in your own words" },
      {
        type: "p",
        text: "Once you've done the above, write a one-line plain-English summary of what each task is actually asking. If you can't, that's a signal to slow down and re-read — or get a second pair of eyes on it.",
      },
      {
        type: "p",
        text: "If a brief still feels ambiguous, that's exactly the kind of thing our brief-analysis support is built for: we translate the wording into a clear plan mapped to every criterion, so you start with confidence.",
      },
    ],
    related: [
      "how-to-structure-a-cipd-assignment",
      "cipd-level-3-vs-5-vs-7-whats-the-difference",
      "how-to-respond-to-cipd-tutor-feedback",
    ],
  },
  {
    slug: "common-mistakes-in-cipd-level-5-assignments",
    title: "Common Mistakes in CIPD Level 5 Assignments",
    description:
      "The most frequent reasons CIPD Level 5 assignments get referred — from description over analysis to weak referencing — and how to avoid each one.",
    category: "Level 5",
    keyword: "CIPD Level 5 assignment guidance",
    date: "2026-07-06",
    readMinutes: 7,
    body: [
      {
        type: "p",
        text: "CIPD Level 5, the Associate Diploma, is where many capable HR professionals get their first referral. The jump from Level 3 is real: Level 5 expects evidence-based practice, analysis and application, not just accurate description. Here are the mistakes we see most often — and how to fix them.",
      },
      { type: "h2", text: "1. Describing when you should be analysing" },
      {
        type: "p",
        text: "This is the number one issue. Explaining what a model is earns few marks; showing how it applies, comparing options, and weighing their suitability for a specific organisation is what Level 5 rewards. Whenever you make a point, ask 'so what?' and answer it.",
      },
      { type: "h2", text: "2. Ignoring the organisational context" },
      {
        type: "p",
        text: "Level 5 answers should be grounded in a real (or realistic) workplace. Generic answers that could apply to any organisation feel thin. Anchor your points to context: sector, size, culture, current challenges.",
      },
      { type: "h2", text: "3. Weak or missing evidence" },
      {
        type: "p",
        text: "Assertions need support. Use credible sources — CIPD factsheets, academic texts, peer-reviewed journals — and cite them properly. 'Research shows…' without a citation is a red flag to an assessor.",
      },
      {
        type: "callout",
        text: "A good test: every key claim in a Level 5 answer should be traceable to either evidence, a model, or a clearly reasoned argument.",
      },
      { type: "h2", text: "4. Referencing errors" },
      {
        type: "p",
        text: "Inconsistent Harvard referencing, missing in-text citations and mismatches between citations and the reference list are easy marks to lose. Build your reference list as you write, not at 2am the night before.",
      },
      { type: "h2", text: "5. Not answering every assessment criterion" },
      {
        type: "p",
        text: "It's surprisingly common to miss a criterion entirely. Map your draft against each AC before submitting and confirm every one is evidenced.",
      },
      { type: "h2", text: "6. Going over — or under — the word count" },
      {
        type: "p",
        text: "Wildly exceeding the limit suggests a lack of focus; falling well short usually means criteria aren't fully addressed. Plan your word budget per task from the start.",
      },
      {
        type: "p",
        text: "If you've already had a draft referred, our draft-review service pinpoints exactly which of these issues cost you marks and how to fix them — turning a referral into a confident resubmission.",
      },
    ],
    related: [
      "how-to-improve-a-cipd-resubmission",
      "how-to-use-harvard-referencing-in-cipd-assessments",
      "how-to-structure-a-cipd-assignment",
    ],
  },
  {
    slug: "how-to-use-harvard-referencing-in-cipd-assessments",
    title: "How to Use Harvard Referencing in CIPD Assessments",
    description:
      "A practical guide to Harvard referencing for CIPD assessments: in-text citations, reference lists, and how to cite CIPD factsheets, books and journals correctly.",
    category: "Referencing",
    keyword: "CIPD Harvard referencing help",
    date: "2026-07-04",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "Referencing is one of the easiest places to gain — or lose — marks in a CIPD assessment. Harvard is the style most CIPD centres expect, and the good news is that it's rule-based: once you know the patterns, it becomes routine. Here's how to get it right.",
      },
      { type: "h2", text: "The two parts of Harvard referencing" },
      {
        type: "p",
        text: "Harvard has two components that must always match: the in-text citation (in the body of your work) and the full reference (in your reference list at the end). Every in-text citation needs a matching entry, and vice versa.",
      },
      { type: "h2", text: "In-text citations" },
      {
        type: "p",
        text: "An in-text citation gives the author's surname and year, for example (Armstrong, 2023). If you quote directly, add a page number: (Armstrong, 2023, p. 45). When the author is named in your sentence, only the year goes in brackets: 'Armstrong (2023) argues that…'.",
      },
      { type: "h2", text: "Formatting the reference list" },
      {
        type: "p",
        text: "List sources alphabetically by author surname. The exact format depends on the source type:",
      },
      {
        type: "ul",
        items: [
          "Book: Armstrong, M. and Taylor, S. (2023) Armstrong's Handbook of Human Resource Management Practice. 16th edn. London: Kogan Page.",
          "Journal article: Guest, D.E. (2017) 'Human resource management and employee well-being', Human Resource Management Journal, 27(1), pp. 22–38.",
          "CIPD factsheet (online): CIPD (2024) Evidence-based practice. [online] London: CIPD. Available at: https://www.cipd.org [Accessed 12 May 2024].",
        ],
      },
      {
        type: "callout",
        text: "Tip: cite CIPD's own factsheets and reports — assessors value them, and they're directly relevant to people-practice topics.",
      },
      { type: "h2", text: "Common referencing mistakes" },
      {
        type: "ul",
        items: [
          "In-text citations with no matching reference (or the reverse).",
          "Inconsistent formatting — mixing styles across the list.",
          "Missing 'Accessed' dates for online sources.",
          "Over-relying on websites instead of academic and CIPD sources.",
        ],
      },
      {
        type: "p",
        text: "Build your reference list as you write — every time you cite something, add it to the list immediately. It's far easier than reconstructing sources afterwards, and it prevents the mismatches that cost marks.",
      },
      {
        type: "p",
        text: "Not sure your referencing is consistent? Our Harvard referencing support checks your in-text citations and reference list against the rules and shows you exactly what to fix.",
      },
    ],
    related: [
      "common-mistakes-in-cipd-level-5-assignments",
      "how-to-understand-a-cipd-assessment-brief",
      "how-to-structure-a-cipd-assignment",
    ],
  },
  {
    slug: "how-to-respond-to-cipd-tutor-feedback",
    title: "How to Respond to CIPD Tutor Feedback",
    description:
      "How to interpret CIPD tutor feedback and turn it into concrete improvements — decoding referral comments, prioritising changes and evidencing each criterion.",
    category: "Feedback",
    keyword: "CIPD tutor feedback",
    date: "2026-07-02",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "Tutor feedback can feel frustratingly vague — 'needs more analysis', 'AC 2.1 not met', 'develop further'. But behind every comment is a specific, fixable gap. Learning to translate feedback into action is what separates a stressful resubmission from a straightforward one.",
      },
      { type: "h2", text: "Read feedback against the criteria, not your ego" },
      {
        type: "p",
        text: "It's natural to feel deflated by a referral. Set that aside and read every comment as a technical instruction tied to a specific assessment criterion. Feedback is a map to the marks you haven't yet secured.",
      },
      { type: "h2", text: "Decode the most common comments" },
      {
        type: "ul",
        items: [
          "'More analysis needed' — you've described; now compare, weigh and reach a judgement.",
          "'AC not met' — a specific criterion isn't evidenced; find it and address it directly.",
          "'Develop further' — the point is valid but too shallow; add depth, evidence or an example.",
          "'Unsupported' — add a citation or reasoning to back the claim.",
          "'Application needed' — connect the theory to a real workplace example.",
        ],
      },
      { type: "h2", text: "Make a feedback action list" },
      {
        type: "p",
        text: "Turn every comment into a specific to-do mapped to a location in your work. This converts a page of daunting comments into a clear checklist.",
      },
      {
        type: "callout",
        text: "Example: 'AC 2.1 not met' becomes 'Add a comparative paragraph in Section 2 weighing the two reward approaches against the organisation's context, supported by one source.'",
      },
      { type: "h2", text: "Address feedback visibly" },
      {
        type: "p",
        text: "When you resubmit, make sure the changes are easy to see. Strengthen the exact areas flagged rather than rewriting everything — targeted improvement is more effective and less risky.",
      },
      {
        type: "p",
        text: "If your feedback is unclear, our feedback-interpretation support translates tutor comments into a plain-English action plan, so you know precisely what each change requires.",
      },
    ],
    related: [
      "how-to-improve-a-cipd-resubmission",
      "common-mistakes-in-cipd-level-5-assignments",
      "how-to-understand-a-cipd-assessment-brief",
    ],
  },
  {
    slug: "cipd-level-3-vs-5-vs-7-whats-the-difference",
    title: "CIPD Level 3 vs Level 5 vs Level 7: What's the Difference?",
    description:
      "A clear comparison of CIPD Level 3, 5 and 7 — who each is for, the depth expected, and how to choose the right qualification for your HR career stage.",
    category: "Choosing a level",
    keyword: "CIPD levels explained",
    date: "2026-06-30",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "CIPD qualifications come in three levels, and choosing the right one — or understanding what your current level demands — matters for both your career and your assessments. Here's how Level 3, Level 5 and Level 7 differ.",
      },
      { type: "h2", text: "CIPD Level 3 — Foundation Certificate" },
      {
        type: "p",
        text: "Level 3 is the entry point, roughly equivalent to A-level study. It's designed for people new to HR — assistants, administrators and career changers. Assessments focus on understanding core concepts and explaining them clearly. The academic bar is supportive: describe, explain and demonstrate awareness.",
      },
      { type: "h2", text: "CIPD Level 5 — Associate Diploma" },
      {
        type: "p",
        text: "Level 5 is roughly undergraduate level and the most popular qualification for practising HR professionals — officers, advisors and people managers. It steps up to evidence-based practice, analysis and application. You're expected to link people practice to organisational performance and support arguments with evidence.",
      },
      { type: "h2", text: "CIPD Level 7 — Advanced Diploma" },
      {
        type: "p",
        text: "Level 7 is postgraduate (Master's) level, for senior and strategic HR professionals. It demands critical analysis, wider reading, strategic thinking and a strong academic argument. Description earns almost nothing here — evaluation, critique and original reasoning are everything.",
      },
      {
        type: "callout",
        text: "Quick guide: Level 3 = explain and demonstrate. Level 5 = analyse and apply. Level 7 = critically evaluate and argue.",
      },
      { type: "h2", text: "Which level is right for you?" },
      {
        type: "ul",
        items: [
          "New to HR or in an administrative role → Level 3.",
          "Practising HR professional wanting recognised, applied capability → Level 5.",
          "Senior, strategic or aiming for Chartered membership → Level 7.",
        ],
      },
      {
        type: "p",
        text: "Whatever level you're studying, our support is tailored to its expectations — supportive and foundational at Level 3, applied and analytical at Level 5, critical and strategic at Level 7.",
      },
    ],
    related: [
      "how-to-understand-a-cipd-assessment-brief",
      "common-mistakes-in-cipd-level-5-assignments",
      "how-to-structure-a-cipd-assignment",
    ],
  },
  {
    slug: "how-to-structure-a-cipd-assignment",
    title: "How to Structure a CIPD Assignment",
    description:
      "A reliable structure for CIPD assignments — introduction, criteria-led sections, workplace application and conclusion — that keeps your response focused and easy to mark.",
    category: "Writing",
    keyword: "how to structure a CIPD assignment",
    date: "2026-06-28",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "A clear structure does two things: it keeps your thinking organised, and it makes your work easy for an assessor to mark against the criteria. A well-structured average answer often outperforms a brilliant but chaotic one. Here's a structure that works across CIPD levels.",
      },
      { type: "h2", text: "1. A focused introduction" },
      {
        type: "p",
        text: "Set the scope, signpost what the response will cover, and — where relevant — introduce the organisational context. Keep it tight: three or four sentences that orient the reader.",
      },
      { type: "h2", text: "2. Criteria-led main sections" },
      {
        type: "p",
        text: "Organise the body around the tasks and assessment criteria, not around a story. Use clear headings that map to the brief. This guarantees you address every criterion and makes it obvious to the assessor where each is met.",
      },
      {
        type: "callout",
        text: "Use the brief's own language in your headings. If a task says 'analyse approaches to reward', a heading like 'Analysis of reward approaches' signals exactly where that criterion is answered.",
      },
      { type: "h2", text: "3. Apply theory to practice" },
      {
        type: "p",
        text: "Within each section, move from theory to application. Introduce the model or concept, then show how it plays out in a real workplace example. Application is where higher marks live, especially at Levels 5 and 7.",
      },
      { type: "h2", text: "4. A conclusion that adds value" },
      {
        type: "p",
        text: "Summarise the key points and, where the brief asks for it, make clear, justified recommendations. Don't introduce new material here — draw the threads together.",
      },
      { type: "h2", text: "5. A complete reference list" },
      {
        type: "p",
        text: "Finish with a full, consistent Harvard reference list. Every in-text citation should appear here, formatted correctly.",
      },
      { type: "h2", text: "Plan before you write" },
      {
        type: "ol",
        items: [
          "List every assessment criterion.",
          "Draft headings that map to each task.",
          "Allocate a word budget to each section.",
          "Note the models, evidence and examples you'll use.",
          "Only then start writing.",
        ],
      },
      {
        type: "p",
        text: "Our structure and planning support gives you a ready-to-write outline mapped to your specific brief, so you never stare at a blank page wondering where to start.",
      },
    ],
    related: [
      "how-to-understand-a-cipd-assessment-brief",
      "how-to-use-harvard-referencing-in-cipd-assessments",
      "common-mistakes-in-cipd-level-5-assignments",
    ],
  },
  {
    slug: "how-to-improve-a-cipd-resubmission",
    title: "How to Improve a CIPD Resubmission",
    description:
      "A calm, practical approach to CIPD resubmissions — how to interpret a referral, target the exact criteria that weren't met, and resubmit with confidence.",
    category: "Resubmissions",
    keyword: "CIPD resubmission support",
    date: "2026-06-26",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "A referral is not a failure — it's a normal part of CIPD study and a clear opportunity to improve. Many strong professionals are referred at least once. The key is to approach the resubmission methodically rather than anxiously rewriting everything.",
      },
      { type: "h2", text: "Understand exactly what was referred" },
      {
        type: "p",
        text: "A referral is almost always tied to specific assessment criteria that weren't fully met — not the whole assignment. Identify precisely which ACs are flagged. Everything that passed can usually stay largely as it is.",
      },
      { type: "h2", text: "Target, don't rewrite" },
      {
        type: "p",
        text: "The most common resubmission mistake is rewriting large sections that were already fine — which risks breaking what worked. Focus your energy on the exact gaps identified in the feedback.",
      },
      {
        type: "callout",
        text: "Most referrals come down to one of three things: not enough analysis, missing application to practice, or a criterion not clearly evidenced. Fix those precisely.",
      },
      { type: "h2", text: "Add depth where it's needed" },
      {
        type: "ul",
        items: [
          "Turn description into analysis by comparing, weighing and judging.",
          "Add a workplace example to demonstrate application.",
          "Support claims with a credible source.",
          "Make sure every flagged criterion is now explicitly answered.",
        ],
      },
      { type: "h2", text: "Check before you resubmit" },
      {
        type: "p",
        text: "Re-map your revised work against each referred criterion and confirm it's now clearly met. A final proofread for clarity and referencing consistency helps too.",
      },
      {
        type: "p",
        text: "Our resubmission support interprets your referral feedback, identifies the exact criteria to target, and guides the improvements needed — so your next submission addresses every point with confidence.",
      },
    ],
    related: [
      "how-to-respond-to-cipd-tutor-feedback",
      "common-mistakes-in-cipd-level-5-assignments",
      "how-to-understand-a-cipd-assessment-brief",
    ],
  },
  {
    slug: "managing-cipd-deadlines-while-working-full-time",
    title: "How UK and UAE Learners Can Manage CIPD Deadlines While Working Full-Time",
    description:
      "Practical strategies for busy HR professionals in the UK and UAE to manage CIPD assignment deadlines alongside a full-time job — planning, focus and knowing when to get support.",
    category: "Study skills",
    keyword: "managing CIPD deadlines",
    date: "2026-06-24",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "Most CIPD learners study while holding down a demanding HR role. Whether you're in the UK, the UAE or studying internationally, the challenge is rarely ability — it's time. Here's how to stay on top of CIPD deadlines without burning out.",
      },
      { type: "h2", text: "Work backwards from the deadline" },
      {
        type: "p",
        text: "Break each assignment into stages — understanding the brief, research, drafting, review, referencing, final edit — and assign each a date working back from your submission deadline. A deadline you've reverse-engineered feels far more manageable than one looming as a single event.",
      },
      { type: "h2", text: "Protect small, regular blocks of time" },
      {
        type: "p",
        text: "Consistency beats intensity. Two focused hours, three times a week, will get you further than one exhausting weekend cram. Put the blocks in your calendar and treat them as fixed appointments.",
      },
      {
        type: "callout",
        text: "A common trap: waiting for a big free weekend that never comes. Small, protected sessions are how busy professionals actually finish assignments.",
      },
      { type: "h2", text: "Reduce friction before each session" },
      {
        type: "ul",
        items: [
          "Keep your brief, notes and sources in one place.",
          "End each session by noting the very next step, so you restart quickly.",
          "Have your reference list open and add to it as you go.",
        ],
      },
      { type: "h2", text: "Manage time zones and centre expectations" },
      {
        type: "p",
        text: "UAE-based learners studying with UK-linked centres sometimes juggle different working weeks and time zones. Clarify submission times in your own local time to avoid a nasty surprise, and build in a buffer for uploads.",
      },
      { type: "h2", text: "Know when support saves you time" },
      {
        type: "p",
        text: "Getting stuck on a brief or a referral can cost days of unproductive worry. Targeted support — a clear plan, a draft review, or referencing help — often saves more time than it takes, letting you submit sooner and with less stress.",
      },
      {
        type: "p",
        text: "If a deadline is tight, message us early. The sooner we understand your brief, word count and timeline, the more we can help you submit calmly and on time.",
      },
    ],
    related: [
      "how-to-understand-a-cipd-assessment-brief",
      "how-to-structure-a-cipd-assignment",
      "how-to-improve-a-cipd-resubmission",
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

// Newest first
export const postsByDate = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
