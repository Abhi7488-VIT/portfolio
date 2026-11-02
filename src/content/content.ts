/**
 * content.ts: the single source of truth for every word, number and link on the site.
 *
 * Rules this file keeps (from the brief):
 *  - Only real facts from Abhishek's résumé. No invented metrics, companies, quotes or links.
 *  - Every URL lives here. Components import from this file and never hard-code a link.
 *  - The phone number is intentionally absent (spam risk).
 *  - Copy avoids em and en dashes (Hallmark gate 19); ranges are written "2023 to 2027" or "2023-27".
 *
 * Anything marked CONFIRM is a reasonable reading of the résumé that Abhishek should check
 * before launch. These are also listed in the README.
 */

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export const links = {
  email: 'abhishekkumarr07044@gmail.com',
  mailto: 'mailto:abhishekkumarr07044@gmail.com',
  linkedin: 'https://linkedin.com/in/ak0704',
  github: 'https://github.com/Abhi7488-VIT',
  resume: '/Abhishek_Kumar_Resume.pdf',
  resumeFileName: 'Abhishek_Kumar_Resume.pdf',
  agentflowDemo: 'https://agentflowww.netlify.app',
  agentflowRepo: 'https://github.com/Abhi7488-VIT/AgentFlow',
  commercelensDemo: 'https://commercelens.streamlit.app',
  commercelensRepo: 'https://github.com/Abhi7488-VIT/CommerceLens',
  nseRepo: 'https://github.com/Abhi7488-VIT/nse-alpha-signal-framework',
  certSql: 'https://courses.cognitiveclass.ai/certificates/b5559f2cfb2e4854844dcc8fbd99a68d',
  certPython: 'https://www.hackerrank.com/certificates/755136fb9741',
  /** CONFIRM: replace with the real production URL after the first Vercel deploy (used by SEO tags + sitemap). */
  siteUrl: 'https://abhishek-kumar.vercel.app',
} as const

/** Search and share metadata. Injected into index.html, the sitemap and robots.txt at build. */
export const seo = {
  title: 'Abhishek Kumar, AI and data engineer',
  description:
    'Abhishek Kumar builds multi-agent AI systems, data analytics products and quant research tools. B.Tech IT at VIT Vellore, open to 2027 roles.',
  ogImage: '/og.png',
  ogImageAlt: 'Abhishek Kumar, AI + Data Engineer. Multi-agent AI systems, data products and quant research tools.',
  themeColor: '#0b0f0a',
}

/**
 * Contact form backend. Formspree is used because it needs no SDK.
 * PLACEHOLDER: create a form at https://formspree.io, then paste its ID here (looks like "xayzabcd").
 * While this is the placeholder, the form says plainly that it is not wired and nothing is sent.
 */
export const FORMSPREE_FORM_ID: string = 'YOUR_FORMSPREE_ID'

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const person = {
  name: 'Abhishek Kumar',
  firstName: 'Abhishek',
  lastName: 'Kumar',
  initials: 'AK',
  role: 'AI + Data Engineer',
  location: 'Vellore, Tamil Nadu, India',
  locationShort: 'Vellore, India',
  school: 'VIT Vellore',
  degree: 'B.Tech Information Technology',
  years: '2023 to 2027',
  cgpa: '8.16',
  availability: 'Open to internships and full-time roles from 2027',
} as const

/* ------------------------------------------------------------------ */
/* Navigation (section ids double as the CI pipeline stages)           */
/* ------------------------------------------------------------------ */

export const sections = [
  { id: 'hero', label: 'Boot', stage: 'boot' },
  { id: 'about', label: 'About', stage: 'profile' },
  { id: 'work', label: 'Work', stage: 'build' },
  { id: 'experience', label: 'Experience', stage: 'test' },
  { id: 'skills', label: 'Skills', stage: 'link' },
  { id: 'extras', label: 'Record', stage: 'verify' },
  { id: 'contact', label: 'Contact', stage: 'deploy' },
] as const

export type SectionId = (typeof sections)[number]['id']

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const hero = {
  /** Typed out like a console boot before the name lands. Each line is real. */
  boot: [
    { cmd: 'init console --operator abhishek', out: 'ok' },
    { cmd: 'mount projects', out: 'agentflow, commercelens, nse-alpha' },
    { cmd: 'check tests', out: '190 passing on agentflow ci' },
    { cmd: 'status', out: 'open to 2027 roles' },
  ],
  nameLines: ['Abhishek', 'Kumar'],
  lede: 'I build multi-agent AI systems, data products and quant research tools.',
  status: [
    { label: 'Role', value: 'AI + Data Engineer' },
    { label: 'Status', value: 'Open to internships and full-time, 2027' },
    { label: 'Location', value: 'Vellore, India' },
  ],
  /** Shown as a live clock row in the status panel. */
  timeZone: 'Asia/Kolkata',
  timeLabel: 'Local time',
  primaryAction: { label: 'Open a channel', href: '#contact' },
  secondaryAction: { label: 'Download résumé', href: links.resume },
} as const

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export const about = {
  heading: 'I like systems that show their work',
  body: [
    'I spend most of my time building things that have to hold up when someone asks why.',
    'A six-agent LangGraph pipeline with 190 tests behind it. A retention analysis across 99,441 orders. A quant framework that reported its own negative Sharpe instead of hiding it.',
  ],
  facts: [
    { label: 'Degree', value: 'B.Tech Information Technology' },
    { label: 'School', value: 'VIT Vellore, 2023 to 2027' },
    { label: 'CGPA', value: '8.16' },
    { label: 'Based in', value: 'Vellore, Tamil Nadu' },
  ],
  /** Rotating ticker. Only real project and skill names. CONFIRM the "sharpening" list. */
  ticker: [
    { verb: 'shipped', items: ['AgentFlow AI', 'CommerceLens', 'NSE Alpha Signal Framework'] },
    { verb: 'building with', items: ['LangGraph', 'FastAPI', 'ChromaDB', 'DuckDB'] },
    { verb: 'sharpening', items: ['SHAP explanations', 'Newey-West statistics', 'Power BI DAX'] },
  ],
} as const

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectId = 'agentflow' | 'commercelens' | 'nse'

export interface Project {
  id: ProjectId
  name: string
  tagline: string
  date: string
  heading: string
  problem: string
  approach: string
  bullets: string[]
  stack: string[]
  metrics: { value: string; label: string }[]
  demo?: string
  repo: string
}

export const workSection = {
  heading: 'Three systems, all on GitHub',
  intro: 'Poke the diagrams. They run on the real numbers.',
}

export const projects: Project[] = [
  {
    id: 'agentflow',
    name: 'AgentFlow AI',
    tagline: 'Multi-agent market intelligence platform',
    date: 'May 2026',
    heading: 'Six agents, one market report',
    problem:
      'Market research means reading thousands of reviews, videos and threads by hand, then writing it all up.',
    approach:
      'A LangGraph pipeline collects from Amazon, YouTube and Reddit, analyses the text, writes a PDF or DOCX report and answers follow-ups with citations.',
    bullets: [
      '6-node LangGraph pipeline that collects market data from Amazon, YouTube and Reddit, runs sentiment, keyword and topic analysis, and auto-generates PDF/DOCX reports.',
      'RAG pipeline using Gemini embeddings in ChromaDB answers follow-up questions on each report with source citations, and returns a fallback reply instead of an unsupported answer.',
      'FastAPI + PostgreSQL backend with 29 REST endpoints, JWT auth, role-based access control and prompt-injection checks, covered by 190 automated tests on GitHub Actions CI with Docker Compose.',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'Google Gemini', 'ChromaDB', 'PostgreSQL', 'React', 'TypeScript', 'Docker'],
    metrics: [
      { value: '6', label: 'LangGraph nodes' },
      { value: '29', label: 'REST endpoints' },
      { value: '190', label: 'automated tests' },
      { value: '3', label: 'data sources' },
    ],
    demo: links.agentflowDemo,
    repo: links.agentflowRepo,
  },
  {
    id: 'commercelens',
    name: 'CommerceLens',
    tagline: 'E-commerce revenue and retention analytics',
    date: 'Sep 2026',
    heading: 'Late deliveries cost the stars',
    problem:
      'Nine tables of orders, deliveries and reviews from a Brazilian marketplace, and no clear view of what drove bad reviews.',
    approach:
      'DuckDB SQL over 99,441 orders, a Power BI dashboard, a late-delivery what-if, and a LightGBM + SHAP model in Streamlit.',
    bullets: [
      'Analysed 99,441 orders across 9 tables with DuckDB SQL (joins, aggregations, CTEs, window functions) and built a Power BI dashboard with DAX measures for revenue, delivery and review KPIs.',
      'Late orders got 1-2 star reviews 62% of the time vs 9% for on-time orders; a what-if slicer estimates about 1,700 fewer low reviews if late deliveries were halved.',
      'LightGBM model flags orders at risk of a 1-2 star review (ROC-AUC 0.67), drivers explained with SHAP, deployed as a Streamlit app.',
    ],
    stack: ['Python', 'SQL', 'DuckDB', 'Power BI', 'DAX', 'LightGBM', 'SHAP', 'Streamlit'],
    metrics: [
      { value: '99,441', label: 'orders analysed' },
      { value: '9', label: 'tables joined' },
      { value: '0.67', label: 'ROC-AUC' },
      { value: '~1,700', label: 'fewer low reviews if late orders halve' },
    ],
    demo: links.commercelensDemo,
    repo: links.commercelensRepo,
  },
  {
    id: 'nse',
    name: 'NSE Alpha Signal Research Framework',
    tagline: 'Cross-sectional alpha research on Indian equities',
    date: 'Oct 2026',
    heading: 'Significant IC, negative Sharpe',
    problem:
      'Most signal backtests look great because they leak the future or ignore trading costs.',
    approach:
      'Score 43 NSE stocks daily on four signals, test on held-out data with a no-lookahead check, then charge 10 bps a side.',
    bullets: [
      'Cross-sectional alpha pipeline scoring 43 NSE stocks daily on 4 signals (pairs mean-reversion, momentum, volume surprise, reversal), evaluated by rank IC, decile spread, turnover and Newey-West t-statistics.',
      'Formation / validation / held-out test split with a no-lookahead test. The pairs signal showed a significant IC (t-stat +2.12), yet all 4 signals had a negative Sharpe after 10 bps/side costs.',
      'Long/short decile backtests with a 1-day execution lag, documented assumptions such as survivorship bias, and an interactive Plotly dashboard report.',
    ],
    stack: ['Python', 'pandas', 'NumPy', 'statsmodels', 'scikit-learn', 'Plotly'],
    metrics: [
      { value: '43', label: 'NSE stocks scored daily' },
      { value: '4', label: 'signals tested' },
      { value: '+2.12', label: 't-stat, pairs IC' },
      { value: '10 bps', label: 'cost per side' },
    ],
    repo: links.nseRepo,
  },
]

/**
 * Real captures of each project (public/work). Taken from the live demo and the public repos on
 * 2 Nov 2026. CommerceLens' Streamlit app was asleep, so its repo stands in until a dashboard capture is added.
 */
export const captures: Record<ProjectId, { src: string; srcSmall: string; width: number; height: number; alt: string; caption: string }> = {
  agentflow: {
    src: '/work/agentflow-live-1600.webp',
    srcSmall: '/work/agentflow-live-800.webp',
    width: 1600,
    height: 920,
    alt: 'AgentFlow landing page: an example workflow for "iPhone 16 battery life" moving through the Research, Cleaning, NLP, Insight, Report and Reviewer agents.',
    caption: 'The live demo’s landing page.',
  },
  commercelens: {
    src: '/work/commercelens-repo-1600.webp',
    srcSmall: '/work/commercelens-repo-800.webp',
    width: 1600,
    height: 893,
    alt: 'The CommerceLens repository on GitHub: sql, notebooks, dashboard, src and scripts folders.',
    caption: 'The repo: DuckDB SQL, notebooks, the Streamlit dashboard and the model code.',
  },
  nse: {
    src: '/work/nse-repo-1600.webp',
    srcSmall: '/work/nse-repo-800.webp',
    width: 1600,
    height: 893,
    alt: 'The NSE alpha signal framework repository on GitHub: signals.py, backtest.py, evaluator.py, data_loader.py, report.py and tests.',
    caption: 'One file per stage: signals, backtest, evaluator, report, with tests.',
  },
}

/**
 * AgentFlow's six LangGraph nodes, named as they appear in the public repo's architecture diagram
 * (github.com/Abhi7488-VIT/AgentFlow). CONFIRM the one-line descriptions.
 */
export const agentflowGraph = {
  sources: ['Amazon', 'YouTube', 'Reddit'],
  nodes: [
    { id: 'research', name: 'Research', does: 'Collects reviews, videos and threads from Amazon, YouTube and Reddit.' },
    { id: 'cleaning', name: 'Cleaning', does: 'Normalises and de-duplicates what came back so the analysis sees clean text.' },
    { id: 'nlp', name: 'NLP', does: 'Runs sentiment, keyword and topic analysis on the cleaned corpus.' },
    { id: 'insight', name: 'Insight', does: 'Turns the analysis into findings with Google Gemini.' },
    { id: 'report', name: 'Report', does: 'Writes the market report and exports it as PDF or DOCX.' },
    { id: 'reviewer', name: 'Reviewer', does: 'Checks the report and sends it back for another pass if it falls short.' },
  ],
  rag: {
    name: 'RAG Q&A',
    does: 'Gemini embeddings in ChromaDB answer follow-up questions with source citations, or a fallback reply when the data cannot support an answer.',
  },
  outputs: ['PDF', 'DOCX'],
  badges: ['29 REST endpoints', '190 automated tests', 'JWT + RBAC', 'Prompt-injection checks', 'Docker + GitHub Actions CI'],
}

/** CommerceLens: the real numbers behind the interactive comparison. */
export const commercelensData = {
  lateLowReviewRate: 62, // % of late orders that got 1-2 star reviews
  onTimeLowReviewRate: 9, // % of on-time orders that got 1-2 star reviews
  halvedLateSaving: 1700, // ~fewer low reviews if late deliveries were halved (résumé)
  orders: 99441,
  tables: 9,
  rocAuc: 0.67,
  /** The slider interpolates linearly between 0 and the résumé's figure at 50%. Labelled as an estimate. */
  sliderNote: 'Linear estimate up to the résumé’s halving scenario (about 1,700).',
}

/** NSE: the honest finding. Chart lines drawn on the page are labelled illustrative. */
export const nseData = {
  stocks: 43,
  signals: [
    { id: 'pairs', name: 'Pairs mean-reversion', note: 'Significant rank IC, t-stat +2.12' },
    { id: 'momentum', name: 'Momentum', note: 'Negative Sharpe after costs' },
    { id: 'volume', name: 'Volume surprise', note: 'Negative Sharpe after costs' },
    { id: 'reversal', name: 'Reversal', note: 'Negative Sharpe after costs' },
  ],
  pairsTStat: 2.12,
  costBpsPerSide: 10,
  executionLagDays: 1,
  finding: 'The pairs signal was statistically real. After 10 bps a side, none of the four made money. Reporting that is the point of the framework.',
  chartDisclaimer: 'Illustrative shapes; the t-stat, costs and each Sharpe’s sign are real.',
}

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

export const experience = {
  heading: 'Ortect Organics, summer 2026',
  role: 'Software Development Intern',
  company: 'Ortect Organics',
  dates: 'May 2026 to Jun 2026',
  stack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
  bullets: [
    { lead: '6+ pages', text: 'Built responsive pages and reusable components for the company website on the MERN stack, in 2-week Agile sprints.' },
    { lead: '5+ endpoints', text: 'Wired REST APIs between the React frontend and Express backend so site data loads and updates itself, replacing manual content edits.' },
    { lead: '75 to 90+', text: 'Raised Lighthouse accessibility by fixing 5+ issues (missing alt text, low contrast, unlabelled fields) and layout bugs across phone, tablet and desktop.' },
  ],
  gauge: { from: 75, to: 90, suffix: '+', label: 'Lighthouse accessibility' },
}

/* ------------------------------------------------------------------ */
/* Skills (exact groups from the brief)                                */
/* ------------------------------------------------------------------ */

/** `projects` and `ortect` drive hover highlighting. Only what the résumé ties together. */
export interface Skill {
  name: string
  projects: ProjectId[]
  ortect?: boolean
}

export interface SkillGroup {
  id: string
  name: string
  skills: Skill[]
}

export const skillsSection = {
  heading: '36 skills, traced to real work',
  hint: 'Drag the nodes. Hover one to light up where it was used.',
  hintTouch: 'Tap a skill to see where it was used.',
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'lang',
    name: 'Languages',
    skills: [
      { name: 'Python', projects: ['agentflow', 'commercelens', 'nse'] },
      { name: 'SQL', projects: ['commercelens'] },
      { name: 'Java', projects: [] },
      { name: 'C++', projects: [] },
      { name: 'JavaScript', projects: [], ortect: true },
      { name: 'TypeScript', projects: ['agentflow'] },
    ],
  },
  {
    id: 'data',
    name: 'Data Analysis & Visualization',
    skills: [
      { name: 'pandas', projects: ['nse'] },
      { name: 'NumPy', projects: ['nse'] },
      { name: 'DuckDB', projects: ['commercelens'] },
      { name: 'Power BI (DAX)', projects: ['commercelens'] },
      { name: 'MS Excel', projects: [] },
      { name: 'Dashboards', projects: ['commercelens', 'nse'] },
      { name: 'Plotly', projects: ['nse'] },
      { name: 'Streamlit', projects: ['commercelens'] },
    ],
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    skills: [
      { name: 'scikit-learn', projects: ['nse'] },
      { name: 'LightGBM', projects: ['commercelens'] },
      { name: 'SHAP', projects: ['commercelens'] },
      { name: 'Isolation Forest', projects: [] },
      { name: 'NLP (VADER)', projects: [] },
    ],
  },
  {
    id: 'genai',
    name: 'Generative AI',
    skills: [
      { name: 'LLMs (Google Gemini)', projects: ['agentflow'] },
      { name: 'RAG', projects: ['agentflow'] },
      { name: 'LangGraph', projects: ['agentflow'] },
      { name: 'ChromaDB', projects: ['agentflow'] },
      { name: 'Prompt-Injection Checks', projects: ['agentflow'] },
    ],
  },
  {
    id: 'web',
    name: 'Web & Databases',
    skills: [
      { name: 'React', projects: ['agentflow'], ortect: true },
      { name: 'FastAPI', projects: ['agentflow'] },
      { name: 'Node.js', projects: [], ortect: true },
      { name: 'Express', projects: [], ortect: true },
      { name: 'REST APIs', projects: ['agentflow'], ortect: true },
      { name: 'JWT Auth', projects: ['agentflow'] },
      { name: 'PostgreSQL', projects: ['agentflow'] },
      { name: 'MongoDB', projects: [], ortect: true },
    ],
  },
  {
    id: 'tools',
    name: 'Tools & DevOps',
    skills: [
      { name: 'Git', projects: [] },
      { name: 'GitHub Actions (CI/CD)', projects: ['agentflow'] },
      { name: 'Docker', projects: ['agentflow'] },
      { name: 'pytest', projects: [] },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Extras: leadership, achievement, certifications                     */
/* ------------------------------------------------------------------ */

export const extras = {
  heading: '40 people, 200+ teams, 2 certificates',
  leadership: {
    title: 'Senior Core, Point of Contact',
    org: 'Technology and Gaming Club, VIT',
    dates: 'Aug 2024 to Apr 2025',
    figure: '40',
    figureLabel: 'member team',
    text: 'Ran club events as the point of contact and led TAG Clash and OverClock: budgets, sponsors, stakeholders and tournament schedules.',
  },
  achievement: {
    title: 'Semi-finalist, HackBattle',
    org: 'IEEE CS Chapter, VIT',
    dates: 'Sep 2024',
    figure: '200+',
    figureLabel: 'teams in the field',
    text: 'Built and pitched a prototype against 200+ teams.',
  },
  certifications: [
    { name: 'SQL and Relational Databases 101', issuer: 'Cognitive Class (IBM Skills Network)', date: 'Oct 2026', href: links.certSql },
    { name: 'Python (Basic) Certification', issuer: 'HackerRank', date: 'Aug 2026', href: links.certPython },
  ],
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export const contact = {
  heading: 'Hiring for 2027? I’m listening',
  lede: 'Internships, full-time roles, or a hard data problem. Email is fastest.',
  copyLabel: 'Copy email',
  copiedToast: 'Email copied to clipboard',
  form: {
    nameLabel: 'Your name',
    emailLabel: 'Your email',
    messageLabel: 'What are you working on?',
    submit: 'Send message',
    sending: 'Sending',
    success: 'Message sent. I’ll reply from abhishekkumarr07044@gmail.com.',
    error: 'That didn’t go through. Email me directly instead.',
    notWired: 'This form isn’t connected yet, so nothing was sent. Please email me instead.',
  },
}

export const footer = {
  note: 'Designed and built by Abhishek Kumar in Vellore.',
  backToTop: 'Back to top',
  availability: 'Open to internships now and full-time roles from 2027.',
}

/** Kinetic marquee before the contact section. Real availability, nothing else. */
export const marquee = {
  phrases: ['Open to 2027 roles', 'AI + data engineering', 'Vellore, India', 'HackBattle semi-finalist 2024'],
}

/* ------------------------------------------------------------------ */
/* Ambient console log (margin). Every line restates a real fact.      */
/* ------------------------------------------------------------------ */

export const consoleLog = [
  'agentflow  collected amazon, youtube, reddit',
  'agentflow  reviewer sent the report back',
  'agentflow  ci: 190 tests passed',
  'agentflow  29 endpoints behind jwt + rbac',
  'commercelens  99,441 orders, 9 tables',
  'commercelens  lightgbm roc-auc 0.67',
  'commercelens  ~1,700 fewer low reviews',
  'nse-alpha  43 stocks scored daily',
  'nse-alpha  pairs ic t-stat +2.12',
  'nse-alpha  10 bps/side: sharpe < 0, all 4',
  'ortect  lighthouse a11y 75 to 90+',
  'tag-club  40-member team, 2 events',
]

/* ------------------------------------------------------------------ */
/* Command palette                                                     */
/* ------------------------------------------------------------------ */

export const palette = {
  placeholder: 'Type a command or search',
  empty: 'No match. Try “resume”, “theme” or a project name.',
}

/* ------------------------------------------------------------------ */
/* "Ask Abhishek's résumé": local knowledge base (no API)              */
/* ------------------------------------------------------------------ */

export interface KbEntry {
  id: string
  /** Lower-case words or short phrases. A question scores a point per match. */
  keywords: string[]
  answer: string
  link?: { label: string; href: string }
}

export const chat = {
  title: 'Ask my résumé',
  intro: 'Ask about projects, skills, experience or availability. Answers come only from my résumé.',
  suggestions: ['What did you build with LangGraph?', 'Are you open to full-time roles?', 'What was the NSE finding?', 'Tell me about the internship'],
  fallback:
    'My résumé doesn’t cover that, so I won’t guess. Try asking about a project, a skill or availability, or email me.',
  placeholder: 'Ask a question',
}

export const knowledgeBase: KbEntry[] = [
  {
    id: 'intro',
    keywords: ['who', 'yourself', 'introduce', 'summary', 'hello', 'hi', 'about you', 'who are you'],
    answer:
      'I’m Abhishek Kumar, a B.Tech IT student at VIT Vellore (2023 to 2027, CGPA 8.16). I build multi-agent AI systems, data analytics products and quant research tools.',
  },
  {
    id: 'education',
    keywords: ['education', 'college', 'university', 'vit', 'degree', 'btech', 'b.tech', 'cgpa', 'gpa', 'graduate', 'graduation', 'study'],
    answer: 'B.Tech in Information Technology at VIT Vellore, 2023 to 2027, with a CGPA of 8.16.',
  },
  {
    id: 'availability',
    keywords: ['available', 'availability', 'hire', 'hiring', 'open', 'open to', 'job', 'roles', 'full-time', 'fulltime', 'full time', 'join', '2027', 'graduate'],
    answer: 'Yes. I’m open to internships now and full-time roles from 2027. Email is the fastest way to reach me.',
    link: { label: 'Email me', href: links.mailto },
  },
  {
    id: 'location',
    keywords: ['where', 'location', 'based', 'city', 'relocate', 'vellore', 'india'],
    answer: 'I’m based in Vellore, Tamil Nadu, India.',
  },
  {
    id: 'internship',
    keywords: ['experience', 'internship', 'intern', 'ortect', 'organics', 'work experience', 'mern'],
    answer:
      'Software Development Intern at Ortect Organics, May to June 2026. I built 6+ responsive pages on MERN, wired 5+ REST endpoints, and took Lighthouse accessibility from about 75 to 90+.',
  },
  {
    id: 'accessibility',
    keywords: ['accessibility', 'a11y', 'lighthouse', 'contrast', 'alt text'],
    answer:
      'At Ortect Organics I raised the Lighthouse accessibility score from about 75 to 90+ by fixing missing alt text, low colour contrast and unlabelled form fields.',
  },
  {
    id: 'agentflow',
    keywords: ['agentflow', 'agent', 'agents', 'multi-agent', 'langgraph', 'market', 'intelligence', 'gemini', 'pipeline'],
    answer:
      'AgentFlow AI is a 6-node LangGraph pipeline that collects data from Amazon, YouTube and Reddit, runs sentiment, keyword and topic analysis, and writes PDF/DOCX reports. Follow-up questions go through a RAG index with citations.',
    link: { label: 'Open AgentFlow on GitHub', href: links.agentflowRepo },
  },
  {
    id: 'rag',
    keywords: ['rag', 'retrieval', 'chromadb', 'embeddings', 'vector', 'citations', 'hallucination'],
    answer:
      'In AgentFlow, Gemini embeddings live in ChromaDB. Follow-up questions are answered with source citations, and when the data can’t support an answer it returns a fallback reply instead.',
  },
  {
    id: 'backend',
    keywords: ['fastapi', 'backend', 'api', 'endpoints', 'jwt', 'rbac', 'auth', 'postgres', 'postgresql', 'security', 'prompt injection', 'injection'],
    answer:
      'AgentFlow’s backend is FastAPI + PostgreSQL: 29 REST endpoints, JWT auth, role-based access control and prompt-injection checks.',
  },
  {
    id: 'testing',
    keywords: ['test', 'tests', 'testing', 'ci', 'github actions', 'docker', 'devops', 'pytest', 'quality'],
    answer: 'AgentFlow has 190 automated tests running on GitHub Actions CI, with Docker Compose for the stack.',
  },
  {
    id: 'commercelens',
    keywords: ['commercelens', 'ecommerce', 'e-commerce', 'retention', 'revenue', 'reviews', 'orders', 'brazil', 'olist', 'power bi', 'dax'],
    answer:
      'CommerceLens analyses 99,441 orders across 9 tables of a Brazilian marketplace with DuckDB SQL and a Power BI dashboard. Late orders got 1-2 star reviews 62% of the time vs 9% for on-time ones.',
    link: { label: 'Open the CommerceLens demo', href: links.commercelensDemo },
  },
  {
    id: 'late',
    keywords: ['late', 'delivery', 'deliveries', 'what-if', 'whatif', 'scenario', '1700', '1,700'],
    answer:
      'Late orders got 1-2 star reviews 62% of the time vs 9% for on-time orders. A what-if slicer estimates about 1,700 fewer low reviews if late deliveries were halved.',
  },
  {
    id: 'model',
    keywords: ['lightgbm', 'model', 'shap', 'roc', 'auc', 'machine learning', 'ml', 'prediction', 'streamlit'],
    answer:
      'In CommerceLens a LightGBM model flags orders at risk of a 1-2 star review (ROC-AUC 0.67). SHAP explains the drivers, and it’s deployed as a Streamlit app.',
  },
  {
    id: 'nse',
    keywords: ['nse', 'alpha', 'quant', 'signal', 'signals', 'stocks', 'trading', 'backtest', 'finance', 'momentum', 'pairs'],
    answer:
      'The NSE Alpha Signal Research Framework scores 43 NSE stocks daily on 4 signals: pairs mean-reversion, momentum, volume surprise and reversal, judged by rank IC, decile spread, turnover and Newey-West t-stats.',
    link: { label: 'Open the repo', href: links.nseRepo },
  },
  {
    id: 'nse-finding',
    keywords: ['nse', 'finding', 'result', 'results', 'sharpe', 't-stat', 'tstat', 'ic', 'costs', 'negative', 'lookahead', 'survivorship', 'honest'],
    answer:
      'The pairs signal showed a significant IC (t-stat +2.12), but all 4 signals had a negative Sharpe after 10 bps/side costs. I used a no-lookahead test, a held-out split and a 1-day execution lag, and reported it straight.',
  },
  {
    id: 'skills',
    keywords: ['skills', 'stack', 'tech', 'technologies', 'tools', 'languages', 'know'],
    answer:
      'Languages: Python, SQL, Java, C++, JavaScript, TypeScript. Data: pandas, NumPy, DuckDB, Power BI, Plotly, Streamlit. ML: scikit-learn, LightGBM, SHAP. GenAI: Gemini, RAG, LangGraph, ChromaDB. Web: React, FastAPI, Node, Express, PostgreSQL, MongoDB.',
  },
  {
    id: 'python',
    keywords: ['python', 'pandas', 'numpy'],
    answer: 'Python runs through all three projects: AgentFlow’s FastAPI backend, CommerceLens’ analysis and model, and the NSE research pipeline. I also hold HackerRank’s Python (Basic) certificate.',
  },
  {
    id: 'sql',
    keywords: ['sql', 'duckdb', 'database', 'databases', 'mongodb', 'queries'],
    answer:
      'SQL: DuckDB in CommerceLens (joins, CTEs, window functions), PostgreSQL in AgentFlow, MongoDB at Ortect Organics, and the Cognitive Class SQL and Relational Databases 101 certificate.',
  },
  {
    id: 'leadership',
    keywords: ['leadership', 'leadership experience', 'led', 'club', 'lead', 'team', 'tag', 'gaming', 'overclock', 'events', 'poc'],
    answer:
      'I was Senior Core and Point of Contact at VIT’s Technology and Gaming Club (Aug 2024 to Apr 2025), leading TAG Clash and OverClock with a 40-member team: budgets, sponsors, stakeholders and scheduling.',
  },
  {
    id: 'hackathon',
    keywords: ['hackathon', 'hackbattle', 'ieee', 'award', 'achievement', 'competition'],
    answer: 'Semi-finalist at HackBattle (IEEE CS Chapter, VIT) in Sep 2024, out of 200+ teams. I built and pitched a prototype.',
  },
  {
    id: 'certs',
    keywords: ['certificate', 'certificates', 'certification', 'certifications', 'hackerrank', 'cognitive', 'ibm'],
    answer:
      'SQL and Relational Databases 101 from Cognitive Class (IBM Skills Network), Oct 2026, and Python (Basic) from HackerRank, Aug 2026.',
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'reach', 'mail', 'message', 'linkedin', 'github', 'socials'],
    answer: 'Email abhishekkumarr07044@gmail.com, or find me on LinkedIn (ak0704) and GitHub (Abhi7488-VIT).',
    link: { label: 'Email me', href: links.mailto },
  },
  {
    id: 'phone',
    keywords: ['phone', 'number', 'call', 'whatsapp', 'mobile'],
    answer: 'I keep my number off the web. Email me and I’ll share it.',
    link: { label: 'Email me', href: links.mailto },
  },
  {
    id: 'resume',
    keywords: ['resume', 'résumé', 'cv', 'pdf', 'download'],
    answer: 'Here’s the PDF.',
    link: { label: 'Download résumé', href: links.resume },
  },
]

/* ------------------------------------------------------------------ */
/* Easter eggs                                                         */
/* ------------------------------------------------------------------ */

export const easterEggs = {
  sudoPhrase: 'sudo hire abhishek',
  sudoToast: 'Permission granted. Opening a channel.',
  konamiToast: 'Blueprint override: grid cranked to eleven.',
  /** Typing "status" anywhere (outside a field) prints a live system report toast. */
  statusPhrase: 'status',
  statusToast: 'All systems nominal. Operator open to 2027 roles.',
}
