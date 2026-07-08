/**
 * CIPD unit content. Powers the /cipd-units index and each /cipd-units/[code] page.
 * These target high-intent, low-competition searches like "5CO01 assignment help".
 * Add a unit by appending here; the routes and sitemap pick it up automatically.
 */

export type Unit = {
  code: string; // e.g. "5CO01"
  slug: string; // lowercase code, used in the URL
  level: "3" | "5" | "7";
  title: string; // official unit title
  qualification: string;
  summary: string; // one line for cards
  overview: string; // opening paragraph
  topics: string[]; // what the unit covers
  challenges: string[]; // common difficulties
  keyword: string;
};

function mk(u: Omit<Unit, "slug">): Unit {
  return { ...u, slug: u.code.toLowerCase() };
}

export const units: Unit[] = [
  // ── Level 3 Foundation Certificate in People Practice ──
  mk({
    code: "3CO01",
    level: "3",
    title: "Business, culture and change in context",
    qualification: "Level 3 Foundation Certificate in People Practice",
    summary: "Understanding external influences, organisational culture and how change affects people practice.",
    overview:
      "3CO01 introduces how external and internal factors shape organisations and the people function. It asks you to show awareness of the business environment, organisational culture, and how change and technology affect the way people work. As a Foundation unit, it rewards clear explanation and relevant examples rather than deep analysis.",
    topics: [
      "External factors and trends affecting organisations",
      "Organisational goals, structures and culture",
      "How change impacts people and the people function",
      "The impact of technology on working practices",
    ],
    challenges: [
      "Keeping answers focused on the specific assessment criteria",
      "Using relevant real-world examples rather than generic statements",
      "Getting to grips with referencing for the first time",
    ],
    keyword: "CIPD 3CO01 assignment help",
  }),
  mk({
    code: "3CO02",
    level: "3",
    title: "Principles of analytics",
    qualification: "Level 3 Foundation Certificate in People Practice",
    summary: "Using data and evidence to inform decisions and measure the value of people practice.",
    overview:
      "3CO02 builds confidence in working with data and evidence. It covers how people professionals use information and analytics to support decisions, and how measuring people practice demonstrates its value. The unit is practical and applied, so worked examples of using data help you meet the criteria.",
    topics: [
      "Evidence-based practice and where data comes from",
      "Using and presenting data to support decisions",
      "Measuring the impact and value of people practice",
      "Handling data ethically and responsibly",
    ],
    challenges: [
      "Interpreting and presenting simple data clearly",
      "Linking data back to a real people-practice decision",
      "Explaining the value of analytics without overcomplicating it",
    ],
    keyword: "CIPD 3CO02 assignment help",
  }),
  mk({
    code: "3CO03",
    level: "3",
    title: "Core behaviours for people professionals",
    qualification: "Level 3 Foundation Certificate in People Practice",
    summary: "Ethical practice, inclusivity and continuing professional development for new people professionals.",
    overview:
      "3CO03 focuses on the behaviours expected of a people professional, including ethical practice, inclusion, and a commitment to ongoing development. It often includes a reflective element, so being able to reflect honestly on your own behaviour and development is central to a strong submission.",
    topics: [
      "Ethical principles and professional values",
      "Inclusive and respectful working",
      "Continuing professional development (CPD)",
      "Reflecting on your own practice and behaviours",
    ],
    challenges: [
      "Writing a genuine, evidenced reflective account",
      "Connecting the CIPD Profession Map behaviours to your own work",
      "Balancing description with honest self-reflection",
    ],
    keyword: "CIPD 3CO03 assignment help",
  }),
  mk({
    code: "3CO04",
    level: "3",
    title: "Essentials of people practice",
    qualification: "Level 3 Foundation Certificate in People Practice",
    summary: "The employee lifecycle, from recruitment and onboarding to performance, reward and the end of employment.",
    overview:
      "3CO04 is a broad, practical unit covering the core of day-to-day people practice across the employee lifecycle. It spans recruitment, selection, onboarding, performance, reward and how employment ends. Because it is wide-ranging, planning your word count carefully across each task is essential.",
    topics: [
      "Recruitment, selection and effective onboarding",
      "The employee lifecycle and key policies",
      "Performance management basics",
      "Reward, and managing the end of the employment relationship",
    ],
    challenges: [
      "Covering a wide range of topics within the word count",
      "Applying each stage to a realistic workplace example",
      "Meeting every assessment criterion across the tasks",
    ],
    keyword: "CIPD 3CO04 assignment help",
  }),

  // ── Level 5 Associate Diploma in People Management ──
  mk({
    code: "5CO01",
    level: "5",
    title: "Organisational performance and culture in practice",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Linking organisational structure, strategy and culture to people practice and performance.",
    overview:
      "5CO01 is one of the most widely studied Level 5 units. It connects organisational strategy, structure and culture to how people practice supports performance and change. Level 5 expects evidence-based analysis and application to your organisation, not just description, which is where many learners are referred.",
    topics: [
      "Organisational structures and the business environment",
      "Strategy, and how people practice connects to it",
      "Organisational culture, behaviour and change",
      "How people practice drives performance",
    ],
    challenges: [
      "Moving from description to genuine analysis",
      "Applying models to a real organisation with evidence",
      "Addressing every assessment criterion in depth",
    ],
    keyword: "CIPD 5CO01 assignment help",
  }),
  mk({
    code: "5CO02",
    level: "5",
    title: "Evidence-based practice",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Using evidence, data and critical thinking to make better people-practice decisions.",
    overview:
      "5CO02 develops your ability to make sound, evidence-based decisions. It covers analysing data, applying critical thinking, and creating value for stakeholders. Strong submissions show a clear line from evidence to recommendation, supported by credible sources.",
    topics: [
      "Principles of evidence-based practice",
      "Analysing data and measuring people-practice impact",
      "Critical thinking and decision-making",
      "Creating value for the organisation and its people",
    ],
    challenges: [
      "Interpreting data and drawing justified conclusions",
      "Demonstrating critical thinking rather than opinion",
      "Linking analysis clearly to recommendations",
    ],
    keyword: "CIPD 5CO02 assignment help",
  }),
  mk({
    code: "5CO03",
    level: "5",
    title: "Professional behaviours and valuing people",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Professional conduct, ethical values, inclusion and continuing professional development at Level 5.",
    overview:
      "5CO03 asks you to demonstrate the professional behaviours and values of an effective people professional, including ethics, inclusion, and a commitment to your own development. It usually includes a reflective component, so evidenced self-reflection is key.",
    topics: [
      "Professional and ethical behaviours",
      "Championing inclusion and wellbeing",
      "Building professional relationships and influence",
      "Reflecting on and planning your development",
    ],
    challenges: [
      "Producing a well-evidenced reflective account",
      "Connecting behaviours to real examples of your practice",
      "Showing depth beyond a descriptive checklist",
    ],
    keyword: "CIPD 5CO03 assignment help",
  }),
  mk({
    code: "5HR01",
    level: "5",
    title: "Employment relationship management",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Employee voice, engagement, employment law basics and managing the employment relationship.",
    overview:
      "5HR01 examines how to build and maintain positive employment relationships. It covers employee voice and engagement, conflict and dispute resolution, and the essentials of employment law. Applying legal and practical points to workplace scenarios is central to meeting the criteria.",
    topics: [
      "Employee voice, engagement and involvement",
      "Managing conflict, grievances and discipline",
      "Employment law essentials in practice",
      "Building positive working relationships",
    ],
    challenges: [
      "Applying employment law accurately to scenarios",
      "Balancing legal detail with practical application",
      "Evidencing points with credible, current sources",
    ],
    keyword: "CIPD 5HR01 assignment help",
  }),
  mk({
    code: "5HR02",
    level: "5",
    title: "Talent management and workforce planning",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Workforce planning, resourcing, talent and managing turnover and retention.",
    overview:
      "5HR02 covers how organisations plan for and manage the talent they need. It spans workforce planning, resourcing and recruitment, talent management, and retention. Strong answers link these activities to organisational performance and use relevant data and examples.",
    topics: [
      "Workforce planning and labour markets",
      "Resourcing, recruitment and selection",
      "Talent management and succession",
      "Turnover, retention and their costs",
    ],
    challenges: [
      "Linking workforce planning to business needs",
      "Using data on turnover and retention effectively",
      "Applying concepts to a specific organisation",
    ],
    keyword: "CIPD 5HR02 assignment help",
  }),
  mk({
    code: "5HR03",
    level: "5",
    title: "Reward for performance and contribution",
    qualification: "Level 5 Associate Diploma in People Management",
    summary: "Reward strategy, pay, benefits and how reward supports performance and motivation.",
    overview:
      "5HR03 explores how reward supports performance, motivation and organisational goals. It covers reward strategy, financial and non-financial reward, and the factors that influence pay decisions. Comparing reward approaches and justifying choices for a context is where higher marks are earned.",
    topics: [
      "Principles and drivers of reward",
      "Financial and non-financial reward",
      "Factors influencing pay and benefits decisions",
      "Linking reward to performance and motivation",
    ],
    challenges: [
      "Comparing and evaluating reward approaches",
      "Justifying reward decisions for a specific context",
      "Supporting arguments with theory and evidence",
    ],
    keyword: "CIPD 5HR03 assignment help",
  }),

  // ── Level 7 Advanced Diploma in Strategic People Management ──
  mk({
    code: "7CO01",
    level: "7",
    title: "Work and working lives in a changing business environment",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Critical analysis of the external context, labour markets, ethics and the future of work.",
    overview:
      "7CO01 takes a strategic, critical view of the environment in which organisations and people operate. It covers labour markets, globalisation, technology, ethics and the changing nature of work. At Level 7, description earns little, so critical evaluation and wider reading are essential.",
    topics: [
      "The external and global business context",
      "Labour markets and the future of work",
      "Ethics, sustainability and corporate responsibility",
      "The changing nature of work and the workforce",
    ],
    challenges: [
      "Demonstrating genuine critical evaluation",
      "Integrating wider academic reading and current research",
      "Building a coherent, argument-led response",
    ],
    keyword: "CIPD 7CO01 assignment help",
  }),
  mk({
    code: "7CO02",
    level: "7",
    title: "People management and development strategies for performance",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Strategic people management, high-performance working and aligning people strategy to business strategy.",
    overview:
      "7CO02 examines how strategic people management and development drive organisational performance. It covers high-performance working, the alignment of people strategy with business strategy, and the role of people professionals as strategic partners. Critical, evidence-led argument is expected throughout.",
    topics: [
      "Aligning people strategy with business strategy",
      "High-performance working practices",
      "The strategic role of the people function",
      "Evaluating the impact of people strategies",
    ],
    challenges: [
      "Thinking and writing at a strategic level",
      "Critically evaluating strategies rather than describing them",
      "Sustaining a persuasive academic argument",
    ],
    keyword: "CIPD 7CO02 assignment help",
  }),
  mk({
    code: "7CO03",
    level: "7",
    title: "Personal effectiveness, ethics and business acumen",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Influencing, ethical values, inclusivity and business acumen for senior people professionals.",
    overview:
      "7CO03 focuses on personal effectiveness, ethical practice and commercial awareness at a senior level. It often includes reflective and applied elements around influencing, decision-making and championing inclusion. Demonstrating critical self-awareness and sound judgement is key.",
    topics: [
      "Ethical values and professional courage",
      "Influencing and building credibility",
      "Championing inclusion and diversity",
      "Business acumen and commercial awareness",
    ],
    challenges: [
      "Producing critically reflective, evidenced writing",
      "Balancing personal reflection with academic rigour",
      "Demonstrating strategic and commercial judgement",
    ],
    keyword: "CIPD 7CO03 assignment help",
  }),
  mk({
    code: "7CO04",
    level: "7",
    title: "Business research in people practice",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "The Level 7 research project: designing, conducting and reporting people-practice research.",
    overview:
      "7CO04 is the Level 7 research project and often the most demanding unit. It requires you to design and conduct a piece of business research in people practice, and to present findings and recommendations. Research methods, ethics and critical evaluation of evidence all need to be handled rigorously.",
    topics: [
      "Formulating a research question and aims",
      "Research design and methods",
      "Analysing findings and drawing conclusions",
      "Evidence-based recommendations and reflection",
    ],
    challenges: [
      "Scoping a realistic, well-defined research question",
      "Choosing and justifying appropriate methods",
      "Analysing data and evaluating evidence critically",
    ],
    keyword: "CIPD 7CO04 assignment help",
  }),
  mk({
    code: "7HR01",
    level: "7",
    title: "Strategic employment relations",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Strategic analysis of employment relations, voice, power and the regulatory context.",
    overview:
      "7HR01 takes a strategic, critical view of employment relations. It covers employee voice, power and partnership, the regulatory and institutional context, and how employment relations strategies affect performance and fairness. Wider reading and critical analysis are essential at this level.",
    topics: [
      "Perspectives and theories on employment relations",
      "Employee voice, engagement and partnership",
      "Power, conflict and the regulatory context",
      "The strategic impact of employment relations",
    ],
    challenges: [
      "Engaging critically with competing perspectives",
      "Applying theory to strategic, real-world contexts",
      "Building a well-referenced, evaluative argument",
    ],
    keyword: "CIPD 7HR01 assignment help",
  }),
  mk({
    code: "7HR02",
    level: "7",
    title: "Resourcing and talent management to sustain success",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Strategic resourcing, talent management and workforce planning to sustain organisational success.",
    overview:
      "7HR02 examines resourcing and talent management from a strategic standpoint. It covers workforce planning, talent strategies, and how resourcing sustains organisational success in a changing environment. Critical evaluation of approaches, supported by evidence, is central to a strong submission.",
    topics: [
      "Strategic workforce and succession planning",
      "Talent management strategies and their impact",
      "Resourcing in a global and changing context",
      "Evaluating and measuring resourcing effectiveness",
    ],
    challenges: [
      "Evaluating strategies critically rather than describing them",
      "Linking talent strategy to sustained performance",
      "Integrating current research and evidence",
    ],
    keyword: "CIPD 7HR02 assignment help",
  }),
  mk({
    code: "7HR03",
    level: "7",
    title: "Strategic reward management",
    qualification: "Level 7 Advanced Diploma in Strategic People Management",
    summary: "Strategic reward, executive pay, fairness and the alignment of reward with strategy.",
    overview:
      "7HR03 explores reward from a strategic perspective. It covers reward strategy and philosophy, executive and international reward, fairness and transparency, and how reward aligns with organisational strategy. At Level 7, you are expected to critically evaluate reward choices and their consequences.",
    topics: [
      "Reward strategy, philosophy and governance",
      "Financial and non-financial reward at a strategic level",
      "Executive and international reward",
      "Fairness, transparency and the ethics of reward",
    ],
    challenges: [
      "Critically evaluating strategic reward decisions",
      "Balancing fairness, cost and performance",
      "Supporting analysis with wider reading",
    ],
    keyword: "CIPD 7HR03 assignment help",
  }),
];

export function getUnit(slug: string) {
  return units.find((u) => u.slug === slug);
}

export const unitsByLevel = (["3", "5", "7"] as const).map((level) => ({
  level,
  units: units.filter((u) => u.level === level),
}));
