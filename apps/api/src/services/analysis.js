import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const DEFAULT_TAXONOMIES = {
  technology: {
    JavaScript: ['javascript', 'js', 'ecmascript'],
    React: ['react', 'next', 'vite'],
    Express: ['express', 'node', 'nodejs'],
    'REST API': ['rest', 'api', 'endpoint', 'http'],
    PostgreSQL: ['postgres', 'postgresql', 'sql', 'database'],
    TensorFlow: ['tensorflow', 'keras', 'deep learning'],
    NLP: ['nlp', 'natural language', 'text classification'],
    Deployment: ['deployment', 'deploy', 'vercel', 'netlify', 'render']
  }
};

const DEFAULT_QUIZ_BANK = {
  technology: [
    {
      id: 'tq1',
      prompt: 'Seberapa nyaman kamu membangun fitur web interaktif dengan JavaScript?',
      options: ['Belum pernah', 'Paham dasar', 'Sering praktik', 'Mampu memimpin implementasi']
    },
    {
      id: 'tq2',
      prompt: 'Seberapa siap kamu membuat REST API dengan validasi dan error handling?',
      options: ['Belum siap', 'Masih belajar', 'Cukup siap', 'Sangat siap']
    },
    {
      id: 'tq3',
      prompt: 'Bagaimana pengalamanmu menggunakan database relasional?',
      options: ['Belum pernah', 'Query dasar', 'Desain tabel sederhana', 'Optimasi dan relasi kompleks']
    }
  ]
};

const ROLE_PROFILES = [
  {
    id: 'fullstack-web-developer',
    name: 'Junior Full-Stack Web Developer',
    domain: 'technology',
    audience: 'Mahasiswa tingkat akhir dan fresh graduates',
    requiredSkills: ['JavaScript', 'React', 'Express', 'REST API', 'PostgreSQL', 'Deployment', 'Testing'],
    businessGoal: 'Siap melamar role full-stack junior dengan portofolio end-to-end.',
    marketSignals: ['React + API integration', 'RESTful backend', 'database persistence', 'public deployment']
  },
  {
    id: 'ai-engineer',
    name: 'Junior AI Engineer',
    domain: 'technology',
    audience: 'Fresh graduates yang ingin masuk ke bidang AI/NLP',
    requiredSkills: ['Python', 'TensorFlow', 'NLP', 'Model Evaluation', 'TensorBoard', 'Model Serving'],
    businessGoal: 'Mampu membangun model NLP untuk ekstraksi skill dan rekomendasi learning path.',
    marketSignals: ['TensorFlow Functional API', 'custom training loop', 'model export', 'inference API']
  },
  {
    id: 'data-scientist',
    name: 'Junior Data Scientist',
    domain: 'technology',
    audience: 'Mahasiswa/fresh graduates yang fokus pada analisis data',
    requiredSkills: ['Python', 'Data Wrangling', 'EDA', 'Feature Engineering', 'A/B Testing', 'Streamlit'],
    businessGoal: 'Mampu mengubah dataset CV, job description, dan quiz menjadi insight siap dashboard.',
    marketSignals: ['data cleaning', 'business questions', 'explanatory analysis', 'interactive dashboard']
  }
];

const ROADMAP_BY_SKILL = {
  JavaScript: 'Practice JavaScript fundamentals through form, state, and validation tasks.',
  React: 'Build the SkillMap frontend flow with reusable React components and responsive states.',
  Express: 'Create Express routes for CV upload, quiz submission, recommendations, and dashboard data.',
  'REST API': 'Document RESTful endpoints and test success, empty, and error responses.',
  PostgreSQL: 'Persist users, CV analysis, quiz attempts, and learning paths in PostgreSQL.',
  Deployment: 'Deploy the frontend and API, then connect production environment variables.',
  Testing: 'Run feature checks for upload, quiz, dashboard, and API failure states.',
  Python: 'Prepare Python notebooks/scripts for preprocessing CV and job description datasets.',
  TensorFlow: 'Train a TensorFlow model with a production-ready export format.',
  NLP: 'Build text preprocessing and skill extraction pipelines for CV content.',
  'Model Evaluation': 'Measure model quality and compare predictions against labeled job requirements.',
  TensorBoard: 'Log training metrics to TensorBoard for monitoring and final reporting.',
  'Model Serving': 'Serve model inference from a Flask or FastAPI service.',
  'Data Wrangling': 'Gather, assess, clean, and document dataset quality before modeling.',
  EDA: 'Create visual analysis of skill distributions and role demand patterns.',
  'Feature Engineering': 'Create role-skill match, quiz readiness, and gap severity features.',
  'A/B Testing': 'Run a Python A/B test for two recommendation presentation variants.',
  Streamlit: 'Deploy an interactive Streamlit dashboard for data insight and conclusions.'
};

function loadJson(filename, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
  } catch {
    return fallback;
  }
}

const taxonomies = loadJson('taxonomies.json', DEFAULT_TAXONOMIES);
const quizBank = loadJson('quizBank.json', DEFAULT_QUIZ_BANK);
const dashboardSnapshot = loadJson('dashboardSnapshot.json', {
  user: { name: 'Demo User', role: 'SkillMap Explorer' },
  skillScore: 76,
  targetRole: 'Junior Full-Stack Web Developer',
  strengths: ['JavaScript', 'React'],
  gaps: ['Express', 'PostgreSQL', 'Deployment'],
  roadmap: []
});

function normalizeText(value = '') {
  return String(value).toLowerCase();
}

function getRoleProfile(targetRole = 'fullstack-web-developer') {
  return ROLE_PROFILES.find((role) => role.id === targetRole) || ROLE_PROFILES[0];
}

function getDomainTaxonomy(domain = 'technology') {
  const base = taxonomies[domain] || taxonomies.technology || DEFAULT_TAXONOMIES.technology;
  const expanded = { ...base };

  for (const role of ROLE_PROFILES) {
    if (role.domain !== domain) {
      continue;
    }

    for (const skill of role.requiredSkills) {
      if (!expanded[skill]) {
        expanded[skill] = [skill.toLowerCase()];
      }
    }
  }

  return expanded;
}

function extractSkills(inputText = '', domain = 'technology') {
  const text = normalizeText(inputText);
  const detectedSkills = [];
  const taxonomy = getDomainTaxonomy(domain);

  for (const [skill, keywords] of Object.entries(taxonomy)) {
    const normalizedKeywords = Array.isArray(keywords) ? keywords : [skill];
    if (normalizedKeywords.some((keyword) => text.includes(normalizeText(keyword)))) {
      detectedSkills.push(skill);
    }
  }

  return [...new Set(detectedSkills)];
}

function createRoadmap(skillGaps, roleProfile) {
  const hasGaps = skillGaps.length > 0;
  const focusGaps = hasGaps ? skillGaps : roleProfile.requiredSkills.slice(0, 3);

  return focusGaps.slice(0, 5).map((skill, index) => ({
    id: `step-${index + 1}`,
    title: hasGaps ? `Close ${skill} gap` : `Polish ${skill} proof`,
    focus: skill,
    duration: index < 2 ? '1-2 weeks' : '2-3 weeks',
    action: ROADMAP_BY_SKILL[skill] || `Build one practical project artifact that proves ${skill}.`
  }));
}

function buildRecommendationTexts(roadmap, roleProfile) {
  const roadmapTexts = roadmap.map((step) => step.action);
  return [
    `Focus on ${roleProfile.name} requirements before applying.`,
    ...roadmapTexts.slice(0, 3),
    'Publish progress as portfolio evidence for recruiters.'
  ];
}

function calculateReadinessScore(extractedSkills, requiredSkills, quizScore = null) {
  const requiredSet = new Set(requiredSkills.map((skill) => skill.toLowerCase()));
  const matchedCount = extractedSkills.filter((skill) => requiredSet.has(skill.toLowerCase())).length;
  const cvScore = Math.round((matchedCount / Math.max(requiredSkills.length, 1)) * 100);

  if (typeof quizScore === 'number') {
    return Math.round(cvScore * 0.6 + quizScore * 0.4);
  }

  return Math.max(35, Math.min(95, cvScore));
}

function readinessLabel(score) {
  if (score >= 85) {
    return 'job-ready';
  }

  if (score >= 65) {
    return 'nearly ready';
  }

  return 'foundation';
}

export function getRoleProfiles() {
  return ROLE_PROFILES;
}

export function extractTextFromUpload(file, body = {}) {
  if (body.text && String(body.text).trim()) {
    return String(body.text);
  }

  if (file?.buffer && (file.mimetype?.startsWith('text/') || file.originalname?.toLowerCase().endsWith('.txt'))) {
    return file.buffer.toString('utf8');
  }

  return [
    file?.originalname || 'uploaded-cv',
    body.targetRole || '',
    body.domain || 'technology',
    'portfolio project communication problem solving'
  ].join(' ');
}

export function analyzeCvText(inputText = '', options = {}) {
  const roleProfile = getRoleProfile(options.targetRole);
  const domain = options.domain || roleProfile.domain;
  const extractedSkills = extractSkills(inputText, domain);
  const normalizedExtracted = new Set(extractedSkills.map((skill) => skill.toLowerCase()));
  const skillGap = roleProfile.requiredSkills.filter((skill) => !normalizedExtracted.has(skill.toLowerCase()));
  const readinessScore = calculateReadinessScore(extractedSkills, roleProfile.requiredSkills);
  const roadmap = createRoadmap(skillGap, roleProfile);
  const confidence = Math.max(0.45, Math.min(0.94, 0.48 + (extractedSkills.length / roleProfile.requiredSkills.length) * 0.42));

  return {
    extractedSkills: extractedSkills.length ? extractedSkills : ['Communication', 'Problem Solving'],
    skillGap,
    recommendation: buildRecommendationTexts(roadmap, roleProfile),
    roadmap,
    readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    confidence,
    domain,
    targetRole: roleProfile.name,
    targetRoleId: roleProfile.id,
    marketSignals: roleProfile.marketSignals,
    businessGoal: roleProfile.businessGoal
  };
}

export function getQuizQuestions(domain = 'technology', targetRole = 'fullstack-web-developer') {
  const baseQuestions = quizBank[domain] || quizBank.technology || DEFAULT_QUIZ_BANK.technology;
  const roleProfile = getRoleProfile(targetRole);
  const roleQuestion = {
    id: `${roleProfile.id}-focus`,
    prompt: `Seberapa siap kamu membuktikan skill utama untuk ${roleProfile.name}?`,
    options: ['Belum punya bukti', 'Ada latihan kecil', 'Ada proyek sederhana', 'Ada portofolio siap demo']
  };

  return [...baseQuestions, roleQuestion].slice(0, 5);
}

export function scoreQuiz(answers = [], options = {}) {
  const roleProfile = getRoleProfile(options.targetRole);
  const questions = getQuizQuestions(options.domain || roleProfile.domain, roleProfile.id);
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const maxScore = questions.length * 3;
  const rawScore = questions.reduce((total, _question, index) => {
    const answerValue = Number(normalizedAnswers[index]);
    return total + (Number.isFinite(answerValue) ? Math.max(0, Math.min(3, answerValue)) : 0);
  }, 0);
  const score = Math.round((rawScore / Math.max(maxScore, 1)) * 100);
  const weakSignals = questions
    .filter((_question, index) => Number(normalizedAnswers[index] ?? 0) <= 1)
    .map((question) => question.prompt);
  const roadmap = createRoadmap(roleProfile.requiredSkills.slice(0, 4), roleProfile);

  return {
    score,
    track: readinessLabel(score),
    answeredCount: normalizedAnswers.filter((answer) => answer !== null && answer !== undefined).length,
    totalQuestions: questions.length,
    weakSignals,
    roadmap: roadmap.map((step) => step.action),
    targetRole: roleProfile.name,
    recommendation:
      score >= 80
        ? 'Prioritize portfolio polish, deployment, and interview storytelling.'
        : 'Strengthen fundamentals first, then convert each skill gap into one portfolio artifact.'
  };
}

export function createPersonalizedRecommendation(payload = {}) {
  const roleProfile = getRoleProfile(payload.targetRole);
  const extractedSkills = Array.isArray(payload.extractedSkills) ? payload.extractedSkills : [];
  const quizScore = typeof payload.quizScore === 'number' ? payload.quizScore : null;
  const normalizedExtracted = new Set(extractedSkills.map((skill) => String(skill).toLowerCase()));
  const skillGap = roleProfile.requiredSkills.filter((skill) => !normalizedExtracted.has(skill.toLowerCase()));
  const readinessScore = calculateReadinessScore(extractedSkills, roleProfile.requiredSkills, quizScore);
  const roadmap = createRoadmap(skillGap, roleProfile);

  return {
    targetRole: roleProfile.name,
    readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    skillGap,
    roadmap,
    recommendation: buildRecommendationTexts(roadmap, roleProfile),
    marketSignals: roleProfile.marketSignals
  };
}

export function getDashboardSnapshot() {
  return {
    ...dashboardSnapshot,
    featureModules: [
      'CV skill extraction',
      'Adaptive quiz',
      'Skill gap mapping',
      'Personalized learning path',
      'Dashboard insight'
    ],
    researchQuestions: [
      'How accurately can NLP detect CV skill gaps against industry requirements?',
      'How does a personalized learning path affect confidence and job readiness?'
    ],
    compliance: {
      frontend: ['React', 'Vite module bundler', 'Axios networking calls', 'responsive UI'],
      backend: ['Express REST API', 'RESTful URL convention', 'PostgreSQL-ready persistence'],
      aiMl: ['CV NLP extraction placeholder', 'model-service integration contract', 'recommendation engine'],
      dataScience: ['skill mapping dataset', 'EDA/dashboard insight contract', 'ready for Streamlit reporting']
    }
  };
}
