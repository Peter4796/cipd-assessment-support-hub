/**
 * Unit enrichment content (AUDIT item 13) — original guidance per CIPD unit.
 *
 * COPYRIGHT RULE: everything here is our own guidance ABOUT each unit,
 * written in our own words. Never paste CIPD's learning outcomes,
 * assessment criteria or brief text verbatim; describe what strong answers
 * demonstrate instead. No em-dashes in reader-facing copy.
 *
 * Consumed by /cipd-units/[code]: "what to demonstrate" list, command-verb
 * chips, criteria tips and FAQs (which also emit FAQPage JSON-LD).
 */

export type CommandVerb = { verb: string; meaning: string };

export type UnitGuidance = {
  /** What a strong submission shows, in our words (never official LO text). */
  demonstrate: string[];
  /** Practical assessment-criteria guidance. */
  criteriaTips: string[];
  /** Unit-specific verbs added before the level defaults, if any. */
  extraVerbs?: CommandVerb[];
  faqs: { question: string; answer: string }[];
};

export const LEVEL_COMMAND_VERBS: Record<"3" | "5" | "7", CommandVerb[]> = {
  "3": [
    { verb: "Identify", meaning: "State the relevant points briefly and clearly." },
    { verb: "Explain", meaning: "Give reasons and context, not just a definition." },
    { verb: "Describe", meaning: "Set out the detail of how something works." },
    { verb: "Summarise", meaning: "Condense the key points without losing meaning." },
  ],
  "5": [
    { verb: "Explain", meaning: "Give reasons and context with supporting detail." },
    { verb: "Analyse", meaning: "Break the topic into parts and examine how they relate." },
    { verb: "Evaluate", meaning: "Weigh strengths and limitations and reach a judgement." },
    { verb: "Compare", meaning: "Set options against each other on clear criteria." },
    { verb: "Justify", meaning: "Support a position with evidence and reasoning." },
  ],
  "7": [
    { verb: "Critically evaluate", meaning: "Test ideas against evidence and counter-arguments before judging." },
    { verb: "Critically analyse", meaning: "Examine assumptions, evidence quality and competing perspectives." },
    { verb: "Assess", meaning: "Reach a reasoned judgement about significance or effectiveness." },
    { verb: "Examine", meaning: "Investigate closely from more than one angle." },
    { verb: "Justify", meaning: "Defend a position with academic evidence and business reasoning." },
  ],
};

export const unitGuidance: Record<string, UnitGuidance> = {
  // ─── Level 3 ───
  "3CO01": {
    demonstrate: [
      "How external trends and pressures shape what a business does and how it is structured",
      "Why organisations change, and how change affects people and their work",
      "How workplace culture and employee behaviour influence performance",
      "Clear links between your points and a real or realistic organisation",
    ],
    criteriaTips: [
      "Ground every answer in a named organisation or a realistic example, not abstract theory.",
      "When you discuss change, cover the people impact, not just the business impact.",
      "Keep answers proportionate: this unit rewards clear explanation over long description.",
    ],
    faqs: [
      {
        question: "Do I need to use my own organisation for 3CO01?",
        answer:
          "It helps but is not required. You can use an organisation you know well from research. What matters is that your examples are specific and consistent across the tasks.",
      },
      {
        question: "How much theory does 3CO01 need?",
        answer:
          "A light touch. Level 3 rewards clear explanation and applied examples more than academic models. Use a simple framework like PESTLE where it genuinely helps you organise external factors.",
      },
      {
        question: "What trips most people up in 3CO01?",
        answer:
          "Describing the organisation instead of answering the question. Every paragraph should map back to a task requirement, with the organisation used as evidence.",
      },
    ],
  },
  "3CO02": {
    demonstrate: [
      "What good data looks like and why evidence beats opinion in people practice",
      "How to read simple people data and turn it into a clear finding",
      "How analytics supports better decisions about people and working practices",
      "Awareness of ethics and confidentiality when handling people data",
    ],
    criteriaTips: [
      "If the brief includes data, actually use it: quote figures and say what they show.",
      "Distinguish clearly between a finding (what the data says) and a recommendation (what to do).",
      "Mention data protection and anonymity wherever you discuss collecting or sharing people data.",
    ],
    faqs: [
      {
        question: "Do I need maths skills for 3CO02?",
        answer:
          "Only basics: percentages, averages and simple trends. The unit tests whether you can interpret and communicate data sensibly, not whether you can do statistics.",
      },
      {
        question: "How should I present data in my answer?",
        answer:
          "Simply and clearly. A small table or a short list of figures with a sentence explaining what each shows is usually enough. Always interpret; never leave a number to speak for itself.",
      },
      {
        question: "What is the most common 3CO02 mistake?",
        answer:
          "Describing types of data at length without ever interpreting any. Assessors want to see you draw a conclusion from evidence and connect it to a people-practice decision.",
      },
    ],
  },
  "3CO03": {
    demonstrate: [
      "What ethical, professional behaviour looks like for a people professional day to day",
      "How to be inclusive and respectful in working relationships",
      "How you learn, reflect and develop in the people profession",
      "Honest self-assessment with concrete examples from your own experience",
    ],
    criteriaTips: [
      "Use first-person examples where the brief invites reflection: this unit expects your own voice.",
      "Link behaviours to consequences: show what changed because you acted professionally or inclusively.",
      "Keep development planning specific: named skills, actions, timescales and how you will know it worked.",
    ],
    faqs: [
      {
        question: "Can I write in the first person for 3CO03?",
        answer:
          "Yes, where the task asks for reflection or self-assessment. Keep the tone professional and support reflective points with specific examples rather than general claims.",
      },
      {
        question: "What if I have limited HR experience?",
        answer:
          "Use any workplace, volunteering or study experience where you showed the behaviours. Assessors are marking the quality of the reflection, not the seniority of the example.",
      },
      {
        question: "How do I make a development plan credible?",
        answer:
          "Name the skill, the action, the resource and the review date. A plan with three concrete commitments beats a page of generic aspirations.",
      },
    ],
  },
  "3CO04": {
    demonstrate: [
      "How the employee lifecycle works from attraction through to exit",
      "The essentials of recruitment, selection and fair legal practice",
      "How pay, performance and development basics fit together",
      "Applied understanding: what a people practitioner actually does at each stage",
    ],
    criteriaTips: [
      "This unit is broad: answer each task tightly rather than writing everything you know about HR.",
      "Where law is relevant, name the principle (for example fairness in selection) without turning the answer into a legal essay.",
      "Practical artefacts score well: a sensible job advert outline or interview plan shows applied skill.",
    ],
    faqs: [
      {
        question: "Is 3CO04 harder than the other Level 3 units?",
        answer:
          "It is usually the largest, because it covers the whole employee lifecycle. Plan your word count per task early so one topic does not swallow the assignment.",
      },
      {
        question: "Do I need to reference employment law in detail?",
        answer:
          "Reference principles accurately but briefly. Show you know discrimination and fairness rules exist and how they shape practice; you are not writing a legal opinion.",
      },
      {
        question: "What does a strong 3CO04 answer look like?",
        answer:
          "One that reads like a competent practitioner talking: each lifecycle stage explained, one applied example each, and clear links between stages rather than isolated mini-essays.",
      },
    ],
  },

  // ─── Level 5 ───
  "5CO01": {
    demonstrate: [
      "How organisational structure and strategy connect to the external business environment",
      "How culture, people practice and organisational performance influence each other",
      "How change lands on people, and what good change support looks like",
      "Applied analysis of a real organisation, not textbook description",
    ],
    criteriaTips: [
      "Anchor the whole assignment in one organisation you know and keep returning to it.",
      "Apply two or three models thoroughly (for example PESTLE plus a culture model) instead of naming many.",
      "For every external factor you analyse, state the people-practice implication: that link is where marks live.",
    ],
    faqs: [
      {
        question: "Can I use my own organisation for 5CO01?",
        answer:
          "Yes, and it is usually the best approach. If you cannot, choose a well-documented organisation and research it properly so your analysis stays specific.",
      },
      {
        question: "Which models work well in 5CO01?",
        answer:
          "PESTLE or SWOT for the environment and an established culture model such as Schein or Handy are common choices. Depth of application matters far more than the number of frameworks.",
      },
      {
        question: "Why do people get referred on 5CO01?",
        answer:
          "Usually for describing rather than analysing, or for leaving analysis disconnected from people practice. Every point should end with a so-what for the organisation and its people.",
      },
    ],
  },
  "5CO02": {
    demonstrate: [
      "What evidence-based practice means and why it produces better people decisions",
      "How to appraise the quality of different evidence sources, including their limits",
      "How to interpret people data and build a reasoned case from it",
      "Judgement: weighing options and recommending with justification",
    ],
    criteriaTips: [
      "When the brief supplies data, interpret it explicitly: quote the figure, state the finding, draw the implication.",
      "Show balance: every source of evidence you use should come with a sentence on its limitations.",
      "Structure decision tasks as option, evidence, judgement so the assessor can follow your reasoning.",
    ],
    faqs: [
      {
        question: "What counts as evidence in 5CO02?",
        answer:
          "Organisational data, stakeholder views, professional expertise and published research. Strong answers combine more than one type and comment on how reliable each is.",
      },
      {
        question: "How do I show critical thinking at Level 5?",
        answer:
          "Question your sources, acknowledge limitations and consider an alternative explanation before you conclude. One honest counterpoint per major claim raises the whole answer.",
      },
      {
        question: "Do I need statistics for 5CO02?",
        answer:
          "No advanced statistics. You need to read tables and trends accurately and turn them into findings a manager could act on.",
      },
    ],
  },
  "5CO03": {
    demonstrate: [
      "What professional and ethical practice means in real people-practice situations",
      "How to champion inclusion and wellbeing in ways that stick",
      "How you keep your own practice current through reflection and development",
      "Personal examples that show the behaviours, not just definitions of them",
    ],
    criteriaTips: [
      "Reflective tasks want your genuine experience: a real dilemma handled honestly outscores a perfect-sounding invented one.",
      "Connect ethics to decisions: show a moment where values changed what you did.",
      "Treat the development plan as a working document with named actions and review points.",
    ],
    faqs: [
      {
        question: "How personal should 5CO03 reflection be?",
        answer:
          "Professional but genuine. Describe the situation, what you did, what you learned and what you now do differently. Assessors reward honesty and specificity.",
      },
      {
        question: "What if my organisation handles ethics poorly?",
        answer:
          "That can make excellent material. Analyse the gap between good practice and what you observe, and what a people professional can do about it constructively.",
      },
      {
        question: "Why do reflective units get referred?",
        answer:
          "Mostly for generic answers with no real examples, or for describing events without extracting learning. The reflection cycle should be visible in every answer.",
      },
    ],
  },
  "5HR01": {
    demonstrate: [
      "How the employment relationship works and what keeps it healthy",
      "How voice, engagement and conflict handling connect to performance",
      "The practical mechanics of discipline, grievance and lawful fair process",
      "Applied judgement in realistic employee-relations scenarios",
    ],
    criteriaTips: [
      "Scenario tasks want procedure plus judgement: set out the fair process and then apply it to the facts given.",
      "Use current, accurate legal principles (for example unfair dismissal basics) without drowning the answer in case law.",
      "Distinguish employee involvement from employee participation clearly; the distinction is frequently tested.",
    ],
    faqs: [
      {
        question: "How much employment law does 5HR01 need?",
        answer:
          "Enough to show a fair, lawful process: the core principles around dismissal, discrimination and procedure. State principles accurately and apply them to the scenario rather than reciting statutes.",
      },
      {
        question: "What is the difference between involvement and participation?",
        answer:
          "Involvement is management seeking employee views; participation gives employees a role in decisions. Strong answers define both, give an example of each and link them to engagement.",
      },
      {
        question: "Why is 5HR01 considered demanding?",
        answer:
          "It mixes concepts, law and applied scenarios in one unit. Answer the scenario that was set, in order, using the facts given; imported generic answers are the main referral cause.",
      },
    ],
  },
  "5HR02": {
    demonstrate: [
      "How workforce planning connects to organisational strategy",
      "How to attract, select and keep the people the organisation needs",
      "How talent pools and succession thinking reduce people risk",
      "Evaluation of practices, not just description of them",
    ],
    criteriaTips: [
      "Always connect a practice to the problem it solves: turnover, scarce skills, succession gaps.",
      "Use one or two labour-market facts or organisational figures to ground your argument.",
      "When asked to evaluate methods, give criteria (cost, speed, fairness, quality) and judge against them.",
    ],
    faqs: [
      {
        question: "What does good workforce planning analysis look like?",
        answer:
          "It starts from strategy: what the organisation intends to do, what capabilities that needs, where the gaps are, and which build, buy or borrow options close them.",
      },
      {
        question: "How do I evaluate selection methods well?",
        answer:
          "Set criteria first, such as predictive validity, cost, candidate experience and fairness, then judge each method against them and conclude with a fit-for-context recommendation.",
      },
      {
        question: "What separates strong 5HR02 answers?",
        answer:
          "Treating retention and talent as risk management: naming which roles and people matter most, why they might leave, and which intervention addresses which risk.",
      },
    ],
  },
  "5HR03": {
    demonstrate: [
      "How reward strategy supports performance and fairness at the same time",
      "The building blocks of pay structures and benefits, and when each fits",
      "How to use market and internal data to keep reward defensible",
      "Judgement on contribution-related pay: what works, what backfires",
    ],
    criteriaTips: [
      "Anchor arguments in principles of fairness, consistency and transparency; assessors look for them explicitly.",
      "Use benchmarking logic: what the market pays, what internal relativities allow, what the law requires.",
      "When evaluating incentives, cover unintended consequences; one-sided praise of bonuses reads as description.",
    ],
    faqs: [
      {
        question: "Do I need my organisation's pay data for 5HR03?",
        answer:
          "No. Use published survey logic and sensible illustrative figures. What matters is showing how a practitioner would use benchmarking and internal relativities to reach a defensible position.",
      },
      {
        question: "What reward theories are worth using?",
        answer:
          "Equity and expectancy thinking cover most tasks: people compare their deal with others and respond to rewards they value and believe they can earn. Apply them to your examples briefly.",
      },
      {
        question: "Why do 5HR03 answers get referred?",
        answer:
          "Describing pay schemes without evaluating them, or ignoring fairness and legal compliance. Every recommendation should say who benefits, what it costs and how it stays fair.",
      },
    ],
  },

  // ─── Level 7 ───
  "7CO01": {
    demonstrate: [
      "Critical understanding of how economic, social and technological change reshapes work",
      "How organisations and the people profession should respond strategically",
      "Balanced argument built from academic and quality practitioner sources",
      "Master's-level judgement: conclusions that acknowledge uncertainty and trade-offs",
    ],
    criteriaTips: [
      "Every major claim needs an evidence base: cite research or credible data, then critique it.",
      "Discuss at least two perspectives before concluding; single-viewpoint answers cap the mark.",
      "Write to the business audience the brief sets while keeping academic rigour underneath.",
    ],
    faqs: [
      {
        question: "How many references does a 7CO01 answer need?",
        answer:
          "Quality beats quantity, but Level 7 typically expects a substantial, current reference list drawn from journals, credible institutes and quality press. Every source should earn its place in the argument.",
      },
      {
        question: "What does critical evaluation actually mean here?",
        answer:
          "Test each idea before you use it: who says so, on what evidence, what the counter-view is, and where it does not hold. Then commit to a reasoned position.",
      },
      {
        question: "How do I handle such broad topics within the word count?",
        answer:
          "Choose depth over coverage. Two or three trends analysed critically with organisational implications beat a survey of everything happening in the world of work.",
      },
    ],
  },
  "7CO02": {
    demonstrate: [
      "How people strategy creates and sustains organisational performance",
      "Critical assessment of people management and development interventions",
      "The line of sight from people practices to outcomes that matter to boards",
      "Strategic recommendations with implementation realism",
    ],
    criteriaTips: [
      "Argue causality carefully: show the mechanism by which a practice improves performance, and the evidence for it.",
      "Use the high-performance work literature critically; note where evidence is contested.",
      "Recommendations should name owners, sequencing and risks, not just intentions.",
    ],
    faqs: [
      {
        question: "What frameworks help in 7CO02?",
        answer:
          "Models linking people practice to performance, such as ability-motivation-opportunity thinking, work well when applied critically to a real context rather than described in the abstract.",
      },
      {
        question: "How strategic should my answers be?",
        answer:
          "Board-level. Frame people issues in terms of capability, risk, cost and value creation, then show how the people function delivers against them.",
      },
      {
        question: "What gets 7CO02 referred?",
        answer:
          "Operational answers to strategic questions, and claimed benefits with no evidence or mechanism. Anchor every intervention to evidence and to the organisation's strategy.",
      },
    ],
  },
  "7CO03": {
    demonstrate: [
      "Critical self-awareness about your own effectiveness, ethics and influence",
      "How ethical reasoning handles real dilemmas where values and business pressure collide",
      "Commercial acumen: understanding the business you serve, not just the profession",
      "Evidence of continuing development as a senior people professional",
    ],
    criteriaTips: [
      "Reflection at Level 7 must be analytical: apply an ethical lens or framework to your own decisions.",
      "Use real dilemmas with the tension made explicit; tidy stories with obvious answers read as shallow.",
      "Show business literacy: financial language, stakeholder mapping and organisational politics handled with judgement.",
    ],
    faqs: [
      {
        question: "How is 7CO03 different from lower-level reflective units?",
        answer:
          "The bar moves from describing what happened to critically analysing why you acted as you did, which values and pressures were in play, and how theory illuminates it.",
      },
      {
        question: "What makes a strong ethical dilemma example?",
        answer:
          "A real situation where two defensible positions conflicted, such as commercial pressure against fairness. Analyse both sides, your reasoning, and what you would refine next time.",
      },
      {
        question: "Why do resubmissions cluster on 7CO03?",
        answer:
          "Because generic reflection is easy to write and easy to refer. Assessors want specific incidents, honest analysis and visible development, criterion by criterion.",
      },
    ],
  },
  "7CO04": {
    demonstrate: [
      "How to design a defensible piece of business research in people practice",
      "Critical literature engagement that positions your question in the field",
      "Sound method choices with limitations acknowledged",
      "Findings turned into conclusions and recommendations a business could act on",
    ],
    criteriaTips: [
      "Keep the research question narrow enough to answer well within the constraints.",
      "Justify every method decision (sample, instrument, analysis) and admit its limits.",
      "Recommendations must trace visibly back to your findings, not to general good practice.",
    ],
    faqs: [
      {
        question: "How narrow should my 7CO04 research question be?",
        answer:
          "Narrower than feels natural: one organisation, one phenomenon, one clear question. A tight question answered rigorously outscores an ambitious question answered thinly.",
      },
      {
        question: "Qualitative or quantitative?",
        answer:
          "Whichever answers your question best within access and ethics constraints. Many strong projects use a small survey plus interviews; what matters is justifying the choice and acknowledging limitations.",
      },
      {
        question: "What are the common 7CO04 pitfalls?",
        answer:
          "Literature reviews that summarise instead of argue, methods sections that describe without justifying, and recommendations that ignore the findings. Keep the thread from question to recommendation unbroken.",
      },
    ],
  },
  "7HR01": {
    demonstrate: [
      "Critical understanding of the strategic employment relations landscape",
      "How voice, partnership and conflict strategies shape organisational outcomes",
      "Evaluation of union and non-union approaches in different contexts",
      "Advice a leadership team could act on, grounded in evidence",
    ],
    criteriaTips: [
      "Set employee relations choices in strategic context: sector, workforce, regulation and history all matter.",
      "Use current developments (gig economy, statutory changes, notable disputes) as analysed evidence, not decoration.",
      "Compare approaches honestly: partnership and assertive strategies both carry risks worth naming.",
    ],
    faqs: [
      {
        question: "Do I need union experience to do well in 7HR01?",
        answer:
          "No. You need to analyse voice and conflict strategically in a context you understand, union or non-union, and evaluate the options open to that organisation.",
      },
      {
        question: "How current does my evidence need to be?",
        answer:
          "Recent enough to show you follow the field: current statutory direction, notable disputes and credible surveys. Blend them with established theory rather than replacing it.",
      },
      {
        question: "What separates Level 7 employment relations answers?",
        answer:
          "Strategy over procedure. Lower levels handle a grievance; 7HR01 asks whether the organisation's whole voice and conflict architecture serves its strategy.",
      },
    ],
  },
  "7HR02": {
    demonstrate: [
      "How resourcing and talent strategy sustains long-term organisational success",
      "Critical evaluation of attraction, assessment and retention practice",
      "Workforce and succession planning under uncertainty",
      "Evidence-led positions on contested talent questions",
    ],
    criteriaTips: [
      "Treat talent choices as strategic bets: cost, risk and capability implications belong in every evaluation.",
      "Engage with the exclusive-versus-inclusive talent debate explicitly when talent pools arise.",
      "Use labour-market evidence to justify positions; assertion without data reads as opinion at this level.",
    ],
    faqs: [
      {
        question: "What is the exclusive versus inclusive talent debate?",
        answer:
          "Whether to concentrate investment on a defined high-potential group or develop talent broadly. Strong answers analyse both positions, the evidence and the fit with context before recommending.",
      },
      {
        question: "How do I make succession planning analysis strategic?",
        answer:
          "Link it to business continuity and risk: which roles would hurt most if vacated, how deep the pipeline is, and how development activity closes the exposure.",
      },
      {
        question: "What evidence impresses in 7HR02?",
        answer:
          "Labour-market data, validity evidence on assessment methods and honest evaluation of your own organisation's practice. Critique of employer branding claims also lands well.",
      },
    ],
  },
  "7HR03": {
    demonstrate: [
      "How reward strategy aligns pay, performance and organisational values",
      "Critical evaluation of executive, contingent and total reward approaches",
      "Fairness, transparency and regulation handled at strategic level",
      "Judgement on what reward can and cannot achieve",
    ],
    criteriaTips: [
      "Engage with fairness debates (gaps in pay, executive ratios, transparency) using evidence, not sentiment.",
      "Evaluate contingent pay critically: motivation theory and the empirical record often disagree with practice.",
      "Frame recommendations in governance terms: what boards, committees and disclosure requirements demand.",
    ],
    faqs: [
      {
        question: "How much motivation theory belongs in 7HR03?",
        answer:
          "Enough to test reward claims against it. Expectancy, equity and intrinsic-motivation research let you critique incentive designs credibly instead of accepting them at face value.",
      },
      {
        question: "Do I need to cover executive reward?",
        answer:
          "Often yes, and it rewards critical treatment: governance, ratios, disclosure and the evidence on whether high incentives deliver performance are rich ground for Level 7 argument.",
      },
      {
        question: "What makes reward analysis strategic rather than technical?",
        answer:
          "Connecting design choices to strategy, culture and risk: what behaviour the organisation is buying, what signal pay sends, and what could go wrong.",
      },
    ],
  },
};

export function getUnitGuidance(code: string): (UnitGuidance & { verbs: CommandVerb[] }) | undefined {
  const guidance = unitGuidance[code.toUpperCase()];
  if (!guidance) return undefined;
  const level = code.trim().charAt(0) as "3" | "5" | "7";
  const defaults = LEVEL_COMMAND_VERBS[level] ?? [];
  return { ...guidance, verbs: [...(guidance.extraVerbs ?? []), ...defaults] };
}
