import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createCareerFitQuiz,
  createFinalCareerResult,
  createRecommendation,
  fetchCvHistory,
  fetchProfile,
  fetchRoles,
  setAuthToken,
  uploadCv
} from './api';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const defaultRole = {
  id: 'fullstack-web-developer',
  name: 'Pengembang Web Full-Stack Junior',
  domain: 'technology',
  requiredSkills: ['JavaScript', 'React', 'Express', 'REST API', 'PostgreSQL', 'Deployment', 'Testing'],
  businessGoal: 'Siap melamar posisi full-stack junior dengan portofolio end-to-end.',
  marketSignals: ['Integrasi React dan API', 'Backend RESTful', 'Penyimpanan database', 'Deployment publik']
};

const emptyAnalysis = {
  extractedSkills: [],
  skillDimiliki: [],
  skillGap: [],
  jobMatches: [],
  recommendation: [],
  roadmap: [],
  courseRecommendations: [],
  learningPath: [],
  confidence: 0,
  readinessScore: 0,
  careerMatchScore: 0,
  gapScore: 0,
  readinessLabel: '',
  targetRole: '',
  targetRoleId: '',
  suggestedRoleId: '',
  marketSignals: [],
  businessGoal: '',
  recommendedCareer: '',
  recommendationSource: '',
  summary: '',
  careerRecommendation: null
};

const biodataFields = [
  {
    id: 'expectedPosition',
    label: 'Role atau posisi yang ingin dituju (opsional)',
    placeholder: 'Contoh: Frontend Developer, Data Analyst, Project Coordinator...',
    wide: true,
    required: false
  },
  {
    id: 'skills',
    label: 'Skill atau pengalaman yang belum tertulis di CV',
    placeholder: 'Contoh: sedang belajar React, pernah koordinasi tim kecil, sedang membuat dashboard data...',
    wide: true,
    multiline: true
  },
  {
    id: 'profileSummary',
    label: 'Profil singkat tambahan',
    placeholder: 'Jelaskan konteks penting yang tidak masuk CV: tujuan karier, hal yang sedang dipelajari, minat role, atau pengalaman informal.',
    wide: true,
    multiline: true
  },
  {
    id: 'experience',
    label: 'Catatan tambahan',
    placeholder: 'Opsional: preferensi belajar, jenis pekerjaan yang dihindari, atau proyek yang belum sempat ditulis di CV.',
    wide: true,
    multiline: true,
    required: false
  }
];

const initialBiodata = {
  expectedPosition: '',
  skills: '',
  profileSummary: '',
  experience: ''
};

const flowPages = [
  { id: 'cv', number: '01', label: 'Upload CV', title: 'Upload CV PDF', description: 'Unggah CV terlebih dahulu sebagai sumber utama analisis.' },
  { id: 'biodata', number: '02', label: 'Profil Singkat', title: 'Profil singkat tambahan', description: 'Tambahkan informasi penting yang belum tertulis di CV.' },
  { id: 'matches', number: '03', label: 'Job Match', title: 'Rekomendasi pekerjaan', description: 'Lihat pekerjaan yang paling cocok berdasarkan persentase kecocokan.' },
  { id: 'quiz', number: '04', label: 'Mini Quiz', title: 'Mini quiz kecenderungan karier', description: 'Pilih tipe pekerjaan yang paling kamu minati untuk memvalidasi rekomendasi.' },
  { id: 'result', number: '05', label: 'Hasil', title: 'Kesimpulan akhir', description: 'Lihat hasil AI dari CV, job match, dan mini quiz.' },
  { id: 'dashboard', number: '06', label: 'Dashboard', title: 'Dashboard personal', description: 'Lihat gap, learning path, dan langkah berikutnya.' }
];
const flowPageTotal = String(flowPages.length).padStart(2, '0');
const flowPageLookup = Object.fromEntries(flowPages.map((page) => [page.id, page]));
const getFlowPageNumber = (pageId) => flowPageLookup[pageId]?.number || '--';

const journeyCards = [
  {
    icon: 'scan',
    title: 'Upload CV sebagai sumber utama',
    description:
      'Pengguna mengunggah CV PDF terlebih dahulu agar sistem membaca pengalaman, skill, dan sinyal karier dari dokumen utama.',
    points: ['CV PDF lebih dulu', 'Dokumen jadi baseline']
  },
  {
    icon: 'brain',
    title: 'Profil singkat pelengkap',
    description:
      'Profil singkat dipakai hanya untuk menjelaskan hal penting yang belum masuk ke CV, bukan data kontak atau biodata umum.',
    points: ['Konteks di luar CV', 'Target dan catatan tambahan']
  },
  {
    icon: 'map',
    title: 'Job match dalam persen',
    description:
      'Skill pengguna dibandingkan ke beberapa role lalu ditampilkan sebagai persentase kecocokan.',
    points: ['Rekomendasi pekerjaan', 'Gap prioritas']
  },
  {
    icon: 'trend',
    title: 'Mini quiz karier',
    description:
      'Pertanyaan singkat membandingkan semua saran role agar rekomendasi akhir mengikuti minat user.',
    points: ['Validasi minat', 'Role final']
  },
  {
    icon: 'result',
    title: 'Hasil akhir dari AI',
    description:
      'Hasil akhir menggabungkan CV, job match, dan mini quiz menjadi rekomendasi role yang paling masuk akal.',
    points: ['Kesimpulan final', 'Fokus learning path']
  },
  {
    icon: 'check',
    title: 'Dashboard insight karier',
    description:
      'Dashboard menampilkan skor, kekuatan, gap, roadmap, dan rekomendasi belajar yang bisa langsung ditindaklanjuti.',
    points: ['Insight hasil analisis', 'Siap ambil langkah berikutnya']
  }
];

const heroStats = [
  { value: '3 menit', label: 'alur scan awal' },
  { value: `${flowPages.length} tahap`, label: 'CV sampai dashboard' },
  { value: 'AI + quiz', label: 'rekomendasi personal' }
];

function getPageFromHash() {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const pageId = window.location.hash.replace(/^#\/?/, '') || 'home';
  if (pageId === 'home') {
    return 'home';
  }

  if (pageId === 'auth' || pageId === 'profile') {
    return pageId;
  }

  return flowPages.some((page) => page.id === pageId) ? pageId : 'home';
}

function scrollToLandingSection(sectionId) {
  if (typeof window === 'undefined') {
    return;
  }

  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function isPdfFile(file) {
  if (!file) {
    return false;
  }

  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function formatMissingFields(fields) {
  return fields.map((field) => field.label.toLowerCase()).join(', ');
}

function getPageBlockMessageForState(pageId, guardState) {
  const pageIndex = flowPages.findIndex((page) => page.id === pageId);

  if (pageIndex > 0 && !guardState.hasSelectedCv) {
    return 'Pilih file CV dulu.';
  }

  if (pageIndex > 1 && !guardState.isBiodataComplete) {
    return `Lengkapi profil singkat dulu: ${formatMissingFields(guardState.missingBiodataFields)}.`;
  }

  if (pageIndex > 1 && !guardState.hasScannedCv) {
    return 'Jalankan scan dari halaman profil singkat sebelum lanjut ke job match.';
  }

  if ((pageId === 'result' || pageId === 'dashboard') && !guardState.quizResult) {
    return 'Jawab mini quiz dulu sebelum masuk dashboard akhir.';
  }

  if (pageId === 'dashboard' && !guardState.finalResult) {
    return 'Lihat hasil akhir dulu sebelum masuk dashboard.';
  }

  return '';
}

function inferTargetRoleIdFromProfile(biodata, roles, fallbackId) {
  const profileText = [
    getMeaningfulText(biodata.expectedPosition),
    getMeaningfulText(biodata.skills),
    getMeaningfulText(biodata.profileSummary),
    getMeaningfulText(biodata.experience)
  ]
    .join(' ')
    .toLowerCase();

  if (!profileText.trim()) {
    return fallbackId;
  }

  const roleKeywords = {
    'fullstack-web-developer': ['web', 'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack', 'react', 'javascript', 'api'],
    'ai-engineer': ['ai', 'machine learning', 'ml', 'model', 'nlp', 'tensorflow', 'pytorch'],
    'data-scientist': ['data', 'analyst', 'scientist', 'python', 'eda', 'visualisasi', 'dashboard'],
    'project-manager-digital': ['project', 'manager', 'coordinator', 'koordinator', 'management', 'timeline', 'leadership', 'komunikasi']
  };

  const scoredRoles = roles.map((role) => {
    const normalizedRoleText = [
      role.id,
      role.name,
      ...(role.requiredSkills || [])
    ]
      .join(' ')
      .toLowerCase();
    const configuredKeywords = roleKeywords[role.id] || [];
    const keywords = [...configuredKeywords, ...normalizedRoleText.split(/[\s/-]+/).filter((word) => word.length > 3)];
    const score = keywords.reduce((total, keyword) => (
      profileText.includes(keyword.toLowerCase()) ? total + 1 : total
    ), 0);

    return { id: role.id, score };
  });

  const bestRole = scoredRoles.sort((first, second) => second.score - first.score)[0];
  return bestRole?.score > 0 ? bestRole.id : fallbackId;
}

function hasMeaningfulText(value) {
  return /[\p{L}\p{N}]/u.test(String(value || '').trim());
}

function getMeaningfulText(value) {
  const normalizedValue = String(value || '').trim();
  return hasMeaningfulText(normalizedValue) ? normalizedValue : '';
}

function formatBiodataText(biodata) {
  const expectedPosition = getMeaningfulText(biodata.expectedPosition);
  const skills = getMeaningfulText(biodata.skills);
  const profileSummary = getMeaningfulText(biodata.profileSummary);
  const experience = getMeaningfulText(biodata.experience);

  return [
    expectedPosition && `Role/posisi yang ingin dituju: ${expectedPosition}`,
    skills && `Skill/pengalaman yang belum tertulis di CV: ${skills}`,
    profileSummary && `Profil singkat tambahan di luar CV: ${profileSummary}`,
    experience && `Catatan tambahan: ${experience}`
  ]
    .filter(Boolean)
    .join('\n');
}

function getRecommendationSourceLabel(source) {
  const labels = {
    user_input: 'Target pilihan user',
    rule_based: 'Keyword dan skill matching',
    hybrid: 'Rule-based + model AI',
    model: 'Model AI',
    local_rules: 'Analisis lokal berbasis rule',
    external: 'Model AI SkillMap'
  };

  return labels[source] || 'AI SkillMap';
}

function formatHistoryDate(value) {
  if (!value) {
    return 'Tanggal tidak tersedia';
  }

  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getCareerFitQuestions(quiz) {
  if (Array.isArray(quiz?.questions) && quiz.questions.length) {
    return quiz.questions.slice(0, 5);
  }

  if (quiz?.prompt && Array.isArray(quiz?.options) && quiz.options.length) {
    return [{
      id: 'career-fit-question-1',
      prompt: quiz.prompt,
      options: quiz.options
    }];
  }

  return [];
}

function getCareerFitQuestionId(question, index) {
  return question.id || `career-fit-question-${index + 1}`;
}

function getSelectedCareerSignal(questions, answers, matches = []) {
  const roleCounts = new Map();
  const roleOptions = new Map();
  const matchScoreByRole = new Map(matches.map((match) => [match.id, match.matchScore || 0]));

  questions.forEach((question, index) => {
    const questionId = getCareerFitQuestionId(question, index);
    const selectedOptionId = answers?.[questionId];
    const selectedOption = question.options?.find((option) => option.id === selectedOptionId);

    if (!selectedOption?.roleId) {
      return;
    }

    roleCounts.set(selectedOption.roleId, (roleCounts.get(selectedOption.roleId) || 0) + 1);
    roleOptions.set(selectedOption.roleId, selectedOption);
  });

  if (!roleCounts.size) {
    return null;
  }

  const selectedRoleId = [...roleCounts.keys()].sort((first, second) => {
    const countDiff = roleCounts.get(second) - roleCounts.get(first);
    if (countDiff !== 0) {
      return countDiff;
    }

    return (matchScoreByRole.get(second) || 0) - (matchScoreByRole.get(first) || 0);
  })[0];

  return {
    ...roleOptions.get(selectedRoleId),
    answerCount: roleCounts.get(selectedRoleId)
  };
}

function hasActionableJobMatch(match = {}) {
  const score = Number(match.matchScore || 0);
  const matchedSkillCount = Array.isArray(match.matchedSkills) ? match.matchedSkills.length : 0;
  return score > 0 || matchedSkillCount > 0;
}

function getMatchedSkillBadges(match = {}) {
  const skills = Array.isArray(match.matchedSkills) ? match.matchedSkills : [];
  const seen = new Set();
  return skills
    .map((skill) => String(skill || '').trim())
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function withCourseUrl(course = {}) {
  return {
    ...course,
    url: course.url || course.course_link || ''
  };
}

function openCourse(event, url) {
  event.preventDefault();
  const opened = window.open(url, '_blank');
  if (opened) {
    opened.opener = null;
  } else {
    window.location.href = url;
  }
}

function CourseItem({ course }) {
  const linkedCourse = withCourseUrl(course);

  return (
    <div className="course-item">
      <span>{linkedCourse.platform}</span>
      <strong>{linkedCourse.title}</strong>
      <p>{linkedCourse.reason}</p>
      {linkedCourse.url && (
        <a
          className="course-link-button"
          href={linkedCourse.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => openCourse(event, linkedCourse.url)}
        >
          Buka course
        </a>
      )}
    </div>
  );
}

function Icon({ name, size = 18 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  if (name === 'upload') {
    return (
      <svg {...commonProps}>
        <path d="M12 15V3" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </svg>
    );
  }

  if (name === 'play') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="m10 8 6 4-6 4V8Z" />
      </svg>
    );
  }

  if (name === 'spark') {
    return (
      <svg {...commonProps}>
        <path d="m12 3 1.8 4.6L18 9.2l-4.2 1.6L12 15l-1.8-4.2L6 9.2l4.2-1.6L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </svg>
    );
  }

  if (name === 'scan') {
    return (
      <svg {...commonProps}>
        <path d="M4 7V5a1 1 0 0 1 1-1h2" />
        <path d="M17 4h2a1 1 0 0 1 1 1v2" />
        <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
        <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
      </svg>
    );
  }

  if (name === 'brain') {
    return (
      <svg {...commonProps}>
        <path d="M8 5a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2.2" />
        <path d="M16 5a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2.2" />
        <path d="M12 5v14" />
        <path d="M8 9h1" />
        <path d="M15 9h1" />
        <path d="M8 15h1" />
        <path d="M15 15h1" />
      </svg>
    );
  }

  if (name === 'map') {
    return (
      <svg {...commonProps}>
        <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...commonProps}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === 'trend') {
    return (
      <svg {...commonProps}>
        <path d="m4 16 5-5 4 4 7-7" />
        <path d="M15 8h5v5" />
      </svg>
    );
  }

  if (name === 'result') {
    return (
      <svg {...commonProps}>
        <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="m9 15 2 2 4-5" />
      </svg>
    );
  }

  return null;
}

const standalonePages = {
  auth: { number: 'Akun', label: 'Masuk / Daftar', title: 'Masuk ke SkillMap', description: 'Gunakan akun Supabase untuk menyimpan dan melihat riwayat scan CV.' },
  profile: { number: 'Profil', label: 'Profil', title: 'Profil dan riwayat scan', description: 'Lihat akun dan riwayat hasil scan CV yang tersimpan.' }
};

function App() {
  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState(defaultRole.id);
  const [biodata, setBiodata] = useState(initialBiodata);
  const [isBiodataSaved, setIsBiodataSaved] = useState(false);
  const [hasScannedCv, setHasScannedCv] = useState(false);
  const [miniQuizAnswer, setMiniQuizAnswer] = useState({});
  const [careerFitQuiz, setCareerFitQuiz] = useState(null);
  const [analysis, setAnalysis] = useState(emptyAnalysis);
  const [quizResult, setQuizResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [extractedCvText, setExtractedCvText] = useState('');
  const [selectedCvFile, setSelectedCvFile] = useState(null);
  const [showBiodataErrors, setShowBiodataErrors] = useState(false);
  const [showCvErrors, setShowCvErrors] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [statusMessage, setStatusMessage] = useState('');
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [cvHistory, setCvHistory] = useState([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const currentUser = session?.user || null;

  const activeRole = useMemo(
    () => roles.find((role) => role.id === targetRole) || defaultRole,
    [roles, targetRole]
  );

  const currentInsight = recommendation || analysis;
  const displayedSkills = (
    currentInsight.skillDimiliki?.length
      ? currentInsight.skillDimiliki
      : currentInsight.skill_dimiliki?.length
        ? currentInsight.skill_dimiliki
        : currentInsight.extractedSkills || analysis.extractedSkills || []
  );
  const topStrengths = displayedSkills.slice(0, 3);
  const topGaps = ((currentInsight.skillGap || analysis.skillGap) || []).slice(0, 3);
  const expectedPositionText = getMeaningfulText(biodata.expectedPosition);
  const requiredBiodataFields = useMemo(
    () => biodataFields.filter((field) => field.required !== false),
    []
  );
  const biodataFilledCount = useMemo(
    () => requiredBiodataFields.filter((field) => hasMeaningfulText(biodata[field.id])).length,
    [biodata, requiredBiodataFields]
  );
  const biodataProgress = Math.round((biodataFilledCount / requiredBiodataFields.length) * 100);
  const rawJobMatches = recommendation?.jobMatches || analysis.jobMatches || [];
  const jobMatches = rawJobMatches.filter(hasActionableJobMatch);
  const bestMatch = jobMatches[0] || {
    id: analysis.suggestedRoleId || targetRole,
    name: analysis.targetRole || activeRole.name,
    matchScore: analysis.readinessScore || 0,
    matchedSkills: analysis.extractedSkills || []
  };
  const rawRecommendedCareerName = currentInsight.recommendedCareer || currentInsight.recommended_career || analysis.recommendedCareer || analysis.recommended_career || '';
  const recommendedCareerName = bestMatch.name || rawRecommendedCareerName || activeRole.name;
  const careerMatchScore = bestMatch.matchScore ?? currentInsight.careerMatchScore ?? currentInsight.career_match_score ?? analysis.careerMatchScore ?? analysis.career_match_score ?? currentInsight.readinessScore ?? 0;
  const careerGapScore = bestMatch.gapScore ?? bestMatch.gap_score ?? Math.max(0, 100 - careerMatchScore);
  const recommendationSource = bestMatch.recommendationSource || currentInsight.recommendationSource || currentInsight.recommendation_source || analysis.recommendationSource || analysis.recommendation_source || '';
  const recommendationSourceLabel = getRecommendationSourceLabel(recommendationSource);
  const rawAiRecommendationMatchesTop = rawRecommendedCareerName
    ? rawRecommendedCareerName.toLowerCase() === recommendedCareerName.toLowerCase()
    : true;
  const topMatchSummary = rawAiRecommendationMatchesTop
    ? currentInsight.summary
    : `${recommendedCareerName} punya sinyal skill paling kuat dari hasil scan. ${rawRecommendedCareerName ? `${rawRecommendedCareerName} ikut terdeteksi, tapi skornya lebih rendah.` : ''}`;
  const activeCareerFitQuiz = careerFitQuiz?.questions?.length || careerFitQuiz?.options?.length ? careerFitQuiz : null;
  const activeCareerFitQuestions = getCareerFitQuestions(activeCareerFitQuiz);
  const answeredCount = activeCareerFitQuestions.filter((question, index) => (
    Boolean(miniQuizAnswer[getCareerFitQuestionId(question, index)])
  )).length;
  const quizProgress = Math.round((answeredCount / Math.max(activeCareerFitQuestions.length, 1)) * 100);
  const selectedCareerOption = getSelectedCareerSignal(activeCareerFitQuestions, miniQuizAnswer, jobMatches);
  const selectedCareerMatch = selectedCareerOption
    ? (jobMatches.find((match) => match.id === selectedCareerOption.roleId) || bestMatch)
    : null;
  const careerRecommendation = currentInsight.careerRecommendation || null;
  const courseRecommendations = currentInsight.courseRecommendations?.length
    ? currentInsight.courseRecommendations.map(withCourseUrl)
    : [];
  const dashboardLearningPath = courseRecommendations.length
    ? courseRecommendations.map((course, index) => ({
        id: `course-${index + 1}-${course.skill}`,
        title: course.skill ? `Pelajari ${course.skill}` : (course.title || `Learning path ${index + 1}`),
        duration: course.platform,
        action: course.reason || `Ikuti ${course.title} sebagai langkah belajar berikutnya.`,
        course
      }))
    : (recommendation?.roadmap || analysis.roadmap || []).map((step, index) => ({
        id: step.id || `roadmap-${index + 1}`,
        title: step.title || `Langkah ${index + 1}`,
        duration: step.duration,
        action: step.action || step
      }));
  const dashboardSignals = (
    currentInsight.marketSignals?.length
      ? currentInsight.marketSignals
      : activeRole.marketSignals?.length
        ? activeRole.marketSignals
        : [...topGaps, ...topStrengths]
  ).slice(0, 5);
  const dashboardTrackLabel = recommendationSource ? recommendationSourceLabel : (quizResult ? 'Jalur paling cocok' : 'Insight awal');
  const dashboardDecisionTitle = finalResult?.recommendedRoleName || recommendedCareerName || quizResult?.selectedRoleName || careerRecommendation?.title || bestMatch.name || activeRole.name;
  const dashboardDecisionCopy = finalResult?.summary || currentInsight.summary || quizResult?.recommendation || careerRecommendation?.summary || activeRole.businessGoal || analysis.businessGoal;
  const dashboardDecisionSupportCopy = quizResult
    ? (finalResult?.quizSummary || `Mini quiz menguatkan arah ${quizResult.selectedRoleName || dashboardDecisionTitle} berdasarkan tipe pekerjaan yang kamu pilih.`)
    : 'Jawaban mini quiz akan membantu memilih role yang paling kamu minati dari daftar rekomendasi.';
  const activePage = standalonePages[currentPage] || flowPages.find((page) => page.id === currentPage) || flowPages[0];
  const missingBiodataFields = useMemo(
    () => requiredBiodataFields.filter((field) => !hasMeaningfulText(biodata[field.id])),
    [biodata, requiredBiodataFields]
  );
  const missingBiodataIds = useMemo(
    () => new Set(missingBiodataFields.map((field) => field.id)),
    [missingBiodataFields]
  );
  const isBiodataComplete = missingBiodataFields.length === 0;
  const navigationGuard = {
    hasSelectedCv: Boolean(selectedCvFile),
    isBiodataComplete,
    hasScannedCv,
    quizResult,
    finalResult,
    missingBiodataFields
  };
  const navigationGuardRef = useRef(navigationGuard);
  navigationGuardRef.current = navigationGuard;

  const getPageBlockMessage = (pageId) => getPageBlockMessageForState(pageId, navigationGuard);
  const clearStatusMessage = () => setStatusMessage('');

  const goToPage = (pageId, options = {}) => {
    if (!options.force) {
      const blockedMessage = getPageBlockMessage(pageId);
      if (blockedMessage) {
        clearStatusMessage();
        if (!selectedCvFile) {
          setShowCvErrors(true);
          setCurrentPage('cv');
          window.history.pushState(null, '', '#/cv');
        } else if (!isBiodataComplete) {
          setShowBiodataErrors(true);
          setCurrentPage('biodata');
          window.history.pushState(null, '', '#/biodata');
        } else if (!hasScannedCv) {
          setCurrentPage('biodata');
          window.history.pushState(null, '', '#/biodata');
        } else {
          setCurrentPage('quiz');
          window.history.pushState(null, '', '#/quiz');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentPage(pageId);
    clearStatusMessage();
    if (window.location.hash !== `#/${pageId}`) {
      window.history.pushState(null, '', `#/${pageId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToHomeSection = (sectionId) => {
    if (currentPage !== 'home') {
      goToPage('home', { force: true });
      window.setTimeout(() => scrollToLandingSection(sectionId), 80);
      return;
    }

    scrollToLandingSection(sectionId);
  };

  const loadProfileData = async () => {
    if (!currentUser) {
      setProfileData(null);
      setCvHistory([]);
      return;
    }

    setIsProfileLoading(true);
    try {
      const [profileResponse, historyResponse] = await Promise.all([
        fetchProfile(),
        fetchCvHistory()
      ]);
      setProfileData(profileResponse.data);
      setCvHistory(historyResponse.data.history || []);
    } catch (error) {
      setAuthMessage(error.response?.data?.error || 'Riwayat belum bisa dimuat. Pastikan env Supabase backend sudah lengkap.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleAuthFieldChange = (field, value) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
    setAuthMessage('');
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsAuthSubmitting(true);
    setAuthMessage('');
    try {
      const email = authForm.email.trim();
      const password = authForm.password;
      const response = authMode === 'sign-up'
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: authForm.name.trim() || email.split('@')[0]
              }
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.session) {
        setAuthMessage('');
        goToPage('profile', { force: true });
      } else {
        setAuthMessage('Cek email kamu untuk konfirmasi akun, lalu masuk kembali.');
      }
    } catch (error) {
      setAuthMessage(error.message || 'Autentikasi gagal. Cek email dan password.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthToken('');
    setSession(null);
    setProfileData(null);
    setCvHistory([]);
    goToPage('home', { force: true });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const nextRoles = Array.isArray(rolesResponse.data.roles) ? rolesResponse.data.roles : [];
        setRoles(nextRoles);
        if (!nextRoles.length) {
          setStatusMessage('Data role dari backend kosong. Analisis tetap bisa jalan dengan target default, tapi konfigurasi backend perlu dicek.');
        }
      } catch (error) {
        setRoles([]);
        setStatusMessage(error.response?.data?.error || 'Gagal memuat data role dari backend. Pastikan VITE_API_URL mengarah ke API SkillMap.');
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setSession(data.session);
      setAuthToken(data.session?.access_token);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthToken(nextSession?.access_token);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    } else {
      setProfileData(null);
      setCvHistory([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleHashChange = (shouldScroll = true) => {
      const nextPage = getPageFromHash();
      const guardState = navigationGuardRef.current;
      const blockedMessage = getPageBlockMessageForState(nextPage, guardState);

      if (blockedMessage) {
        clearStatusMessage();
        if (!guardState.hasSelectedCv) {
          setShowCvErrors(true);
          setCurrentPage('cv');
          window.history.replaceState(null, '', '#/cv');
        } else if (!guardState.isBiodataComplete) {
          setShowBiodataErrors(true);
          setCurrentPage('biodata');
          window.history.replaceState(null, '', '#/biodata');
        } else if (!guardState.hasScannedCv) {
          setCurrentPage('biodata');
          window.history.replaceState(null, '', '#/biodata');
        } else {
          setCurrentPage('quiz');
          window.history.replaceState(null, '', '#/quiz');
        }
      } else {
        setCurrentPage(nextPage);
      }

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    const handleHashChangeEvent = () => handleHashChange(true);

    handleHashChange(false);
    window.addEventListener('hashchange', handleHashChangeEvent);
    return () => window.removeEventListener('hashchange', handleHashChangeEvent);
  }, []);

  const handleBiodataChange = (field, value) => {
    setBiodata((current) => ({
      ...current,
      [field]: value
    }));
    setIsBiodataSaved(false);
    setHasScannedCv(false);
    setRecommendation(null);
    setQuizResult(null);
    setFinalResult(null);
    setMiniQuizAnswer({});
    clearStatusMessage();
  };

  const handleSaveBiodata = async () => {
    if (!selectedCvFile) {
      setShowCvErrors(true);
      clearStatusMessage();
      goToPage('cv', { force: true });
      return;
    }

    if (!isBiodataComplete) {
      setShowBiodataErrors(true);
      clearStatusMessage();
      goToPage('biodata', { force: true });
      return;
    }

    setShowBiodataErrors(false);
    setIsBiodataSaved(true);
    setTargetRole(inferTargetRoleIdFromProfile(biodata, roles, targetRole));
    await handleAnalyzeProfile(selectedCvFile);
  };

  const handleAnalyzeProfile = async (file = null) => {
    if (!file) {
      setShowCvErrors(true);
      clearStatusMessage();
      goToPage('cv', { force: true });
      return;
    }

    if (!isBiodataComplete) {
      setShowBiodataErrors(true);
      clearStatusMessage();
      goToPage('biodata', { force: true });
      return;
    }

    setIsUploading(true);
    setShowCvErrors(false);
    clearStatusMessage();

    try {
      const profileText = formatBiodataText(biodata);
      const targetJob = getMeaningfulText(biodata.expectedPosition);
      const inferredTargetRole = inferTargetRoleIdFromProfile(biodata, roles, targetRole);
      const inferredRole = roles.find((role) => role.id === inferredTargetRole) || activeRole;
      setTargetRole(inferredTargetRole);
      const response = await uploadCv(file, inferredRole.domain || 'technology', inferredTargetRole, profileText, targetJob);
      const nextAnalysis = {
        ...response.data,
        jobMatches: (response.data.jobMatches || []).filter(hasActionableJobMatch)
      };
      setAnalysis(nextAnalysis);
      setExtractedCvText(response.data.extractedCvText || '');
      setRecommendation(null);
      setQuizResult(null);
      setFinalResult(null);
      setMiniQuizAnswer({});
      let nextCareerFitQuiz = null;
      let nextStatusMessage = '';
      try {
        const quizResponse = await createCareerFitQuiz({
          jobMatches: nextAnalysis.jobMatches || [],
          extractedSkills: nextAnalysis.extractedSkills || [],
          skillDimiliki: nextAnalysis.skillDimiliki || [],
          skillGap: nextAnalysis.skillGap || [],
          targetRole: nextAnalysis.suggestedRoleId || inferredTargetRole,
          recommendedCareer: nextAnalysis.recommendedCareer,
          aiSource: nextAnalysis.aiSource
        });
        const backendQuiz = quizResponse.data.question || null;
        nextCareerFitQuiz = getCareerFitQuestions(backendQuiz).length ? backendQuiz : null;
        if (!nextCareerFitQuiz) {
          nextStatusMessage = 'Analisis CV berhasil, tapi backend tidak mengirim pertanyaan mini quiz.';
        }
      } catch (quizError) {
        nextStatusMessage = quizError.response?.data?.error || 'Analisis CV berhasil, tapi mini quiz gagal dibuat oleh backend.';
      }
      setCareerFitQuiz(nextCareerFitQuiz);
      setHasScannedCv(true);
      if (currentUser) {
        loadProfileData();
      }
      if (response.data.suggestedRoleId) {
        setTargetRole(response.data.suggestedRoleId);
      }
      goToPage('matches', { force: true });
      if (nextStatusMessage) {
        setStatusMessage(nextStatusMessage);
      } else {
        clearStatusMessage();
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.message || 'Analisis CV gagal. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isPdfFile(file)) {
        setStatusMessage('CV hanya bisa diupload dalam format PDF (.pdf).');
        event.target.value = '';
        goToPage('cv');
        return;
      }

      setSelectedCvFile(file);
      setHasScannedCv(false);
      setRecommendation(null);
      setQuizResult(null);
      setFinalResult(null);
      setMiniQuizAnswer({});
      setCareerFitQuiz(null);
      setExtractedCvText('');
      setShowCvErrors(false);
      clearStatusMessage();
      goToPage('biodata');
      event.target.value = '';
    }
  };

  const handleQuizSubmit = async () => {
    if (answeredCount < activeCareerFitQuestions.length || !selectedCareerOption) {
      clearStatusMessage();
      return;
    }

    setIsSubmittingQuiz(true);
    clearStatusMessage();

    try {
      const selectedMatch = selectedCareerMatch || bestMatch;
      const selectedRoleId = selectedCareerOption.roleId || selectedMatch.id || analysis.suggestedRoleId || targetRole;
      const baseScore = selectedMatch.matchScore ?? analysis.readinessScore ?? 0;
      const quizScore = Math.min(96, Math.max(55, baseScore + 10));
      const quizAnswers = activeCareerFitQuestions.map((question, index) => {
        const questionId = getCareerFitQuestionId(question, index);
        const selectedOptionId = miniQuizAnswer[questionId];
        const selectedOption = question.options?.find((option) => option.id === selectedOptionId);

        return {
          question: question.prompt,
          selectedResponse: selectedOption?.response || '',
          selectedRoleId: selectedOption?.roleId || '',
          selectedRoleName: selectedOption?.label || ''
        };
      });
      const adjustedJobMatches = jobMatches
        .map((match) => (
          match.id === selectedRoleId
            ? {
                ...match,
                matchScore: Math.min(96, Math.max(match.matchScore || 0, quizScore)),
                quizSignal: true
              }
            : match
        ))
        .sort((first, second) => (second.matchScore || 0) - (first.matchScore || 0));
      const quizData = {
        score: quizScore,
        track: 'career-fit',
        selectedRoleId,
        selectedRoleName: selectedMatch.name || selectedCareerOption.label,
        selectedResponse: selectedCareerOption.response,
        recommendation: `Mini quiz menguatkan arah ${selectedMatch.name || selectedCareerOption.label}. Fokuskan roadmap pada bukti yang relevan dengan pilihan ini.`
      };

      setQuizResult(quizData);
      setTargetRole(selectedRoleId);

      const recommendationResponse = await createRecommendation({
        targetRole: selectedRoleId,
        extractedSkills: analysis.skillDimiliki?.length ? analysis.skillDimiliki : analysis.extractedSkills,
        quizScore
      });
      const nextRecommendation = {
        ...recommendationResponse.data,
        extractedSkills: analysis.extractedSkills,
        skillDimiliki: analysis.skillDimiliki,
        jobMatches: adjustedJobMatches,
        suggestedRoleId: selectedRoleId,
        selectedCareerSignal: selectedCareerOption
      };
      setRecommendation(nextRecommendation);

      const finalResponse = await createFinalCareerResult({
        cvText: analysis.aiReadableText || analysis.extractedCvText || extractedCvText,
        profile: biodata,
        recommendedCareer: analysis.recommendedCareer,
        extractedSkills: analysis.extractedSkills || [],
        skillDimiliki: analysis.skillDimiliki || [],
        skillGap: nextRecommendation.skillGap || analysis.skillGap || [],
        jobMatches: adjustedJobMatches,
        recommendation: nextRecommendation,
        quiz: {
          score: quizScore,
          selectedRoleId,
          selectedRoleName: selectedMatch.name || selectedCareerOption.label,
          answers: quizAnswers
        }
      });
      setFinalResult(finalResponse.data);
      clearStatusMessage();
      goToPage('result', { force: true });
    } catch (error) {
      setStatusMessage(error.message || 'Pengiriman kuis gagal. Silakan coba lagi.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className={`page-shell page-${currentPage}`}>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => goToPage('home', { force: true })} aria-label="Beranda SkillMap">
          SkillMap
        </button>

        {currentPage === 'home' ? (
          <nav className="site-nav" aria-label="Navigasi landing page">
            <button className="active" type="button" onClick={() => goToHomeSection('home')}>
              Beranda
            </button>
            <button type="button" onClick={() => goToHomeSection('features')}>
              Fitur
            </button>
            <button type="button" onClick={() => goToHomeSection('project-fit')}>
              Manfaat
            </button>
            <button type="button" onClick={() => goToHomeSection('contact')}>
              Kontak
            </button>
          </nav>
        ) : (
          <div className="header-step-summary" aria-live="polite">
            <span>Langkah {activePage.number} / {flowPageTotal}</span>
            <strong>{activePage.label}</strong>
          </div>
        )}

        <div className="header-actions">
          <button className="nav-cta" type="button" onClick={() => goToPage(currentPage === 'home' ? 'cv' : 'home', { force: true })}>
            {currentPage === 'home' ? 'Mulai Scan' : 'Beranda'}
          </button>
          <button
            className="account-button"
            type="button"
            onClick={() => goToPage(currentUser ? 'profile' : 'auth', { force: true })}
          >
            {currentUser ? 'Profil' : 'Masuk'}
          </button>
        </div>
      </header>

      <main>
        <section className="account-section auth-section">
          <div className="section-heading compact">
            <span className="page-counter">Akun</span>
            <h2>{authMode === 'sign-up' ? 'Daftar akun SkillMap' : 'Masuk ke SkillMap'}</h2>
            <p>Simpan hasil scan CV ke Supabase dan buka kembali riwayatnya dari halaman profil.</p>
          </div>

          <div className="account-grid">
            <form className="account-panel auth-panel" onSubmit={handleAuthSubmit}>
              <div className="auth-mode-toggle" aria-label="Pilih mode autentikasi">
                <button
                  className={authMode === 'sign-in' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setAuthMode('sign-in');
                    setAuthMessage('');
                  }}
                >
                  Sign in
                </button>
                <button
                  className={authMode === 'sign-up' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setAuthMode('sign-up');
                    setAuthMessage('');
                  }}
                >
                  Sign up
                </button>
              </div>

              {!isSupabaseConfigured && (
                <p className="auth-warning">
                  Supabase belum dikonfigurasi. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di environment frontend.
                </p>
              )}

              {authMode === 'sign-up' && (
                <div className="field-group">
                  <label className="field-label" htmlFor="auth-name">Nama</label>
                  <input
                    id="auth-name"
                    value={authForm.name}
                    onChange={(event) => handleAuthFieldChange('name', event.target.value)}
                    placeholder="Nama kamu"
                  />
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={authForm.email}
                  onChange={(event) => handleAuthFieldChange('email', event.target.value)}
                  placeholder="email@contoh.com"
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={authForm.password}
                  onChange={(event) => handleAuthFieldChange('password', event.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
              </div>

              {authMessage && <p className="auth-message">{authMessage}</p>}

              <button className="primary-button" type="submit" disabled={isAuthSubmitting || !isSupabaseConfigured}>
                {isAuthSubmitting ? 'Memproses...' : authMode === 'sign-up' ? 'Buat Akun' : 'Masuk'}
              </button>
            </form>

            <article className="account-panel">
              <span className="panel-label">Riwayat tersimpan</span>
              <h3>Setelah login, setiap scan CV tersimpan ke profil kamu.</h3>
              <p className="panel-helper">
                Backend memakai token Supabase untuk mengenali user, lalu menyimpan hasil scan ke PostgreSQL Supabase yang terhubung lewat `DATABASE_URL`.
              </p>
              <button className="secondary-button" type="button" onClick={() => goToPage('cv', { force: true })}>
                Lanjut scan tanpa melihat profil
              </button>
            </article>
          </div>
        </section>

        <section className="account-section profile-section">
          <div className="section-heading compact">
            <span className="page-counter">Profil</span>
            <h2>Profil dan riwayat scan CV</h2>
            <p>Lihat hasil scan yang tersimpan untuk akun Supabase kamu.</p>
          </div>

          {!currentUser ? (
            <article className="account-panel profile-empty">
              <h3>Masuk dulu untuk melihat riwayat.</h3>
              <p className="panel-helper">Riwayat scan CV hanya bisa ditampilkan setelah kamu login.</p>
              <button className="primary-button" type="button" onClick={() => goToPage('auth', { force: true })}>
                Masuk / Daftar
              </button>
            </article>
          ) : (
            <div className="profile-grid">
              <aside className="account-panel profile-summary-card">
                <span className="panel-label">Akun</span>
                <h3>{profileData?.user?.name || currentUser.email}</h3>
                <p>{profileData?.user?.email || currentUser.email}</p>
                <div className="profile-stat-grid">
                  <div>
                    <strong>{profileData?.stats?.cvScanCount ?? cvHistory.length}</strong>
                    <span>Scan CV</span>
                  </div>
                  <div>
                    <strong>{profileData?.stats?.quizAttemptCount ?? 0}</strong>
                    <span>Quiz</span>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="secondary-button" type="button" onClick={loadProfileData} disabled={isProfileLoading}>
                    {isProfileLoading ? 'Memuat...' : 'Refresh'}
                  </button>
                  <button className="primary-button" type="button" onClick={handleSignOut}>
                    Keluar
                  </button>
                </div>
              </aside>

              <section className="account-panel history-panel">
                <div className="history-heading">
                  <div>
                    <span className="panel-label">Riwayat CV</span>
                    <h3>Scan terbaru</h3>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => goToPage('cv', { force: true })}>
                    Scan CV baru
                  </button>
                </div>

                {isProfileLoading ? (
                  <p className="empty-state-text">Memuat riwayat...</p>
                ) : cvHistory.length ? (
                  <div className="history-list">
                    {cvHistory.map((item) => {
                      const scanAnalysis = item.analysis || {};
                      const scanMatch = scanAnalysis.jobMatches?.[0] || {};
                      const scanScore = scanAnalysis.readinessScore || scanMatch.matchScore || 0;
                      const scanRole = scanAnalysis.targetRole || scanMatch.name || 'Role belum tersedia';
                      const scanSkills = (scanAnalysis.extractedSkills || []).slice(0, 4);

                      return (
                        <article className="history-card" key={item.id || `${item.fileName}-${item.createdAt}`}>
                          <div>
                            <span>{formatHistoryDate(item.createdAt)}</span>
                            <strong>{item.fileName}</strong>
                            <p>{scanRole}</p>
                          </div>
                          <div className="history-score">
                            <strong>{scanScore}%</strong>
                            <span>match</span>
                          </div>
                          <div className="chip-row">
                            {scanSkills.length
                              ? scanSkills.map((skill) => <span className="chip" key={skill}>{skill}</span>)
                              : <span className="chip ghost">Skill belum tersedia</span>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state-text">Belum ada riwayat scan CV untuk akun ini.</p>
                )}
              </section>
            </div>
          )}
        </section>

        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <Icon name="spark" size={14} />
              Navigasi karier berbasis AI
            </span>
            <h1>SkillMap</h1>
            <p className="hero-lede">
              Navigator pembelajaran berbasis AI untuk mahasiswa akhir dan fresh graduate
              yang ingin tahu skill gap, persentase job match, dan learning path paling relevan
              sebelum melamar kerja.
            </p>

            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => goToPage('cv', { force: true })}>
                <Icon name="play" size={17} />
                Upload CV Dulu
              </button>
            </div>

            <div className="hero-proof-row" aria-label="Ringkasan produk SkillMap">
              {heroStats.map((stat) => (
                <div className="hero-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section className="journey-section" id="features">
          <div className="section-heading">
            <h2>Alur Pengguna SkillMap</h2>
            <p>
              Flow dibuat seperti career matcher: CV masuk dulu, profil singkat melengkapi konteks,
              pekerjaan diurutkan berdasarkan kecocokan, lalu mini quiz mengunci hasil akhir sebelum dashboard personal.
            </p>
          </div>

          <div className="journey-grid">
            {journeyCards.map((card) => (
              <article className="journey-card" key={card.title}>
                <div className="card-icon">
                  <Icon name={card.icon} size={23} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ul>
                  {card.points.map((point) => (
                    <li key={point}>
                      <Icon name="check" size={13} />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-heading compact">
            <span className="page-counter">Langkah {activePage.number} dari {flowPageTotal}</span>
            <h2>{activePage.title}</h2>
            <p>{activePage.description}</p>
          </div>

          {statusMessage && (
            <p className="status-line workspace-status">{statusMessage}</p>
          )}

          <div className="workspace-grid">
            <article className="workspace-panel biodata-panel">
              <div className="panel-label">{getFlowPageNumber('biodata')} / Profil Singkat</div>
              <h3>Tambahkan konteks yang belum ada di CV</h3>
              <p className="panel-helper">
                Bagian ini bukan data kontak. Tulis hal penting yang tidak masuk CV agar analisis lebih tepat.
              </p>

              <div className="biodata-progress">
                <span>{biodataFilledCount} dari {requiredBiodataFields.length} konteks wajib terisi</span>
                <div className="progress-track" aria-label={`Progres profil singkat ${biodataProgress}%`}>
                  <span style={{ width: `${biodataProgress}%` }} />
                </div>
              </div>

              {selectedCvFile && (
                <div className="profile-use-note">
                  <span>CV utama</span>
                  <p>{selectedCvFile.name} sudah dipakai sebagai sumber utama. Isi form ini hanya untuk melengkapi konteks yang belum tertulis di CV.</p>
                </div>
              )}

              <div className="biodata-grid">
                {biodataFields.map((field) => (
                  <div className={`field-group ${field.wide ? 'wide' : ''}`} key={field.id}>
                    <label className="field-label" htmlFor={`biodata-${field.id}`}>
                      {field.label}
                      {field.required !== false && (
                        <span className="required-mark" aria-label="wajib">*</span>
                      )}
                    </label>
                    {field.multiline ? (
                      <textarea
                        className={showBiodataErrors && missingBiodataIds.has(field.id) ? 'field-invalid' : ''}
                        id={`biodata-${field.id}`}
                        value={biodata[field.id]}
                        onChange={(event) => handleBiodataChange(field.id, event.target.value)}
                        placeholder={field.placeholder}
                        required
                        aria-invalid={showBiodataErrors && missingBiodataIds.has(field.id)}
                      />
                    ) : (
                      <input
                        className={showBiodataErrors && missingBiodataIds.has(field.id) ? 'field-invalid' : ''}
                        id={`biodata-${field.id}`}
                        type={field.type || 'text'}
                        value={biodata[field.id]}
                        onChange={(event) => handleBiodataChange(field.id, event.target.value)}
                        placeholder={field.placeholder}
                        required={field.required !== false}
                        aria-invalid={showBiodataErrors && missingBiodataIds.has(field.id)}
                      />
                    )}
                    {showBiodataErrors && missingBiodataIds.has(field.id) && (
                      <span className="field-error">Bagian ini wajib diisi.</span>
                    )}
                  </div>
                ))}
              </div>

              <button className="primary-button panel-action" type="button" onClick={handleSaveBiodata} disabled={isUploading}>
                {isUploading ? 'Menganalisis CV...' : 'Scan CV & Lihat Job Match'}
              </button>
            </article>

            <article className="workspace-panel cv-panel">
              <div className="panel-label">{getFlowPageNumber('cv')} / Upload CV</div>
              <h3>Upload CV PDF dulu</h3>
              <p className="panel-helper">
                CV menjadi sumber utama analisis. Setelah file masuk, baru tambahkan profil singkat untuk hal yang tidak tertulis di CV.
              </p>
              <div className="profile-use-note">
                <span>Urutan baru</span>
                <p>Upload CV PDF, isi profil singkat tambahan, scan AI, lalu lihat job match.</p>
              </div>
              <input
                className="sr-only"
                id="cv-upload-panel"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleUpload}
              />
              <label className="secondary-button upload-panel-button" htmlFor="cv-upload-panel" aria-disabled={isUploading}>
                <Icon name="upload" size={16} />
                {isUploading ? 'AI sedang scan...' : selectedCvFile ? 'Ganti file CV PDF' : 'Upload file CV PDF'}
              </label>
              {selectedCvFile && (
                <p className="selected-file">File siap: {selectedCvFile.name}</p>
              )}
              {showCvErrors && !selectedCvFile && (
                <p className="field-error cv-file-error">CV PDF wajib diupload sebelum lanjut.</p>
              )}
              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('home', { force: true })}>
                  Kembali ke Beranda
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    if (!selectedCvFile) {
                      setShowCvErrors(true);
                      clearStatusMessage();
                      return;
                    }
                    goToPage('biodata');
                  }}
                >
                  Lanjut Isi Profil Singkat
                </button>
              </div>

              {hasScannedCv && extractedCvText && (
                <div className="result-block pdf-output-block">
                  <span>Teks PDF yang dibaca AI</span>
                  <textarea
                    className="pdf-text-output"
                    value={extractedCvText}
                    readOnly
                    aria-label="Teks hasil ekstraksi PDF yang dibaca AI"
                  />
                </div>
              )}

              {hasScannedCv && (
                <div className="result-block">
                  <span>Skill dimiliki</span>
                  <div className="chip-row">
                    {displayedSkills.length
                      ? displayedSkills.map((skill) => (
                        <span className="chip" key={skill}>{skill}</span>
                      ))
                      : <span className="chip">Belum ada skill yang cocok</span>}
                  </div>
                </div>
              )}

              {hasScannedCv && (
                <div className="result-block">
                  <span>Gap prioritas</span>
                  <div className="chip-row">
                    {analysis.skillGap?.map((gap) => (
                      <span className="chip ghost" key={gap}>{gap}</span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="workspace-panel match-panel">
              <div className="panel-label">{getFlowPageNumber('matches')} / Rekomendasi Pekerjaan</div>
              <h3>Persentase kecocokan dari AI</h3>
              <p className="panel-helper">
                {hasScannedCv
                  ? 'Hasil ini berasal dari CV dan profil singkat tambahan terbaru yang kamu kirim.'
                  : 'Jalankan scan CV untuk melihat hasil personal.'}
              </p>

              <div className="top-match-card">
                <span>Rekomendasi utama berdasarkan skill match</span>
                <strong>{recommendedCareerName}</strong>
                <p>{careerMatchScore}% kecocokan, gap {careerGapScore}%</p>
                {recommendationSource && <small>{recommendationSourceLabel}</small>}
                {(topMatchSummary || careerRecommendation?.summary) && (
                  <p>{topMatchSummary || careerRecommendation?.summary}</p>
                )}
              </div>

              <div className="match-list">
                {jobMatches.map((match) => {
                  const matchedSkillBadges = getMatchedSkillBadges(match);

                  return (
                    <div className="match-row" key={match.id || match.name}>
                      <div>
                        <strong>{match.name}</strong>
                        <span>{matchedSkillBadges.length} skill cocok</span>
                        {matchedSkillBadges.length > 0 && (
                          <div className="match-skill-badges" aria-label={`Skill cocok untuk ${match.name}`}>
                            {matchedSkillBadges.map((skill) => (
                              <span className="match-skill-badge" key={`${match.id || match.name}-${skill}`}>{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="match-score">
                        <span>{match.matchScore}%</span>
                        <div className="match-meter" aria-label={`Kecocokan ${match.matchScore}%`}>
                          <span style={{ width: `${match.matchScore}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('biodata', { force: true })}>
                  Kembali ke Profil Singkat
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => goToPage('quiz')}
                  disabled={activeCareerFitQuestions.length === 0}
                >
                  Lanjut Mini Quiz
                </button>
              </div>
            </article>

            <article className="workspace-panel quiz-panel">
              <div className="panel-label">{getFlowPageNumber('quiz')} / Mini Quiz</div>
              <h3>Pilih arah yang paling kamu minati</h3>
              <p className="panel-copy">{answeredCount} dari {activeCareerFitQuestions.length} pertanyaan terjawab</p>
              <div className="progress-track" aria-label={`Progres kuis ${quizProgress}%`}>
                <span style={{ width: `${quizProgress}%` }} />
              </div>
              <p className="panel-helper">
                Opsi di bawah dibuat dari daftar job match hasil scan CV untuk memastikan kamu paling condong ke role yang mana.
              </p>

              {activeCareerFitQuestions.map((question, questionIndex) => {
                const questionId = getCareerFitQuestionId(question, questionIndex);

                return (
                  <div className="mini-quiz-card" key={questionId}>
                    <span>{questionIndex === 0 ? (activeCareerFitQuiz.context || 'Role yang dibandingkan berasal dari hasil scan CV.') : `Pertanyaan ${questionIndex + 1}`}</span>
                    <p>{question.prompt}</p>
                    <div className="option-grid career-fit-options">
                      {question.options.map((option) => (
                        <button
                          className={`option-button career-fit-option ${miniQuizAnswer[questionId] === option.id ? 'active' : ''}`}
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setQuizResult(null);
                            setFinalResult(null);
                            setMiniQuizAnswer((current) => ({
                              ...current,
                              [questionId]: option.id
                            }));
                          }}
                        >
                          <strong>{option.response}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!activeCareerFitQuestions.length && (
                <p className="empty-state-text">Mini quiz belum tersedia dari backend untuk hasil scan ini.</p>
              )}

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('matches', { force: true })}>
                  Kembali ke Job Match
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={isSubmittingQuiz || activeCareerFitQuestions.length === 0 || answeredCount < activeCareerFitQuestions.length}
                >
                  {isSubmittingQuiz ? 'Menghitung...' : 'Lihat Hasil'}
                </button>
              </div>

              {quizResult && (
                <div className="score-card">
                  <strong>{quizResult.score}%</strong>
                  <span>{quizResult.track}</span>
                  <p>{quizResult.recommendation}</p>
                </div>
              )}
            </article>

            <article className="workspace-panel result-panel">
              <div className="panel-label">{getFlowPageNumber('result')} / Hasil Akhir</div>
              <h3>Kesimpulan akhir dari AI</h3>
              <p className="panel-helper">
                Hasil ini menggabungkan isi CV, daftar saran job dari scan, dan pola jawaban mini quiz.
              </p>

              <div className="final-result-card">
                <span>Final job recommendation</span>
                <strong>{finalResult?.recommendedRoleName || recommendedCareerName || quizResult?.selectedRoleName || bestMatch.name}</strong>
                <p>{finalResult?.summary || currentInsight.summary || quizResult?.recommendation || careerRecommendation?.summary || 'Hasil akhir belum tersedia dari backend.'}</p>
              </div>

              <div className="result-summary-grid">
                <section className="result-summary-block">
                  <span>Ringkasan CV</span>
                  <p>{finalResult?.cvSummary || (topStrengths.length ? `Skill terdeteksi: ${topStrengths.join(', ')}.` : 'Belum ada skill spesifik yang terdeteksi dari CV.')}</p>
                </section>
                <section className="result-summary-block">
                  <span>Saran job</span>
                  <p>{finalResult?.jobMatchSummary || `${recommendedCareerName} muncul dengan kecocokan ${careerMatchScore}% dan gap ${careerGapScore}%.`}</p>
                </section>
                <section className="result-summary-block">
                  <span>Mini quiz</span>
                  <p>{finalResult?.quizSummary || `${answeredCount} jawaban sudah dipakai sebagai validasi minat.`}</p>
                </section>
              </div>

              <div className="result-summary-block">
                <span>Fokus learning path</span>
                <div className="chip-row">
                  {(finalResult?.nextFocus?.length ? finalResult.nextFocus : topGaps).length
                    ? (finalResult?.nextFocus?.length ? finalResult.nextFocus : topGaps).map((focus) => (
                      <span className="chip ghost" key={focus}>{focus}</span>
                    ))
                    : <span className="chip ghost">Tidak ada gap prioritas</span>}
                </div>
              </div>

              <div className="course-list result-course-list">
                {courseRecommendations.slice(0, 3).map((course) => (
                  <CourseItem course={course} key={`${course.skill}-${course.title}`} />
                ))}
              </div>

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('quiz', { force: true })}>
                  Kembali ke Mini Quiz
                </button>
                <button className="primary-button" type="button" onClick={() => goToPage('dashboard')}>
                  Lanjut Dashboard
                </button>
              </div>
            </article>

          </div>
        </section>

        <section className="dashboard-section" id="dashboard">
          {statusMessage && (
            <p className="status-line workspace-status">{statusMessage}</p>
          )}

          <article className="workspace-panel roadmap-panel-card dashboard-shell">
            <div className="dashboard-hero-band">
              <div className="dashboard-headline">
                <div className="panel-label">{getFlowPageNumber('dashboard')} / Dasbor Personal</div>
                <h3>Arah kariermu saat ini</h3>
                <strong className="dashboard-role-title">{dashboardDecisionTitle}</strong>
                <p className="dashboard-summary-copy">{dashboardDecisionCopy}</p>
                <div className="dashboard-tag-row">
                  <span>{expectedPositionText || 'Target role belum diisi'}</span>
                  <span>{dashboardTrackLabel}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-content-grid">
              <section className="dashboard-section-block dashboard-roadmap-card">
                <div className="dashboard-block-heading">
                  <span>Roadmap learning path</span>
                  <strong>{dashboardLearningPath.length} langkah belajar berikutnya</strong>
                </div>
                <div className="roadmap-list dashboard-roadmap-list">
                  {dashboardLearningPath.length ? dashboardLearningPath.map((step, index) => (
                    <div className="roadmap-step" key={step.id || step.action}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{step.title || `Langkah ${index + 1}`}</strong>
                        {step.duration && <small>{step.duration}</small>}
                        <p>{step.action || step}</p>
                        {step.course?.url && (
                          <a
                            className="dashboard-course-link"
                            href={step.course.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => openCourse(event, step.course.url)}
                          >
                            Buka learning path: {step.course.title}
                          </a>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-state-text">Learning path belum tersedia dari hasil analisis terakhir.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="dashboard-insight-grid">
              <section className="dashboard-section-block">
                <div className="dashboard-skill-columns">
                  <div className="dashboard-skill-panel">
                    <span>Yang sudah kuat</span>
                    <div className="chip-row">
                      {topStrengths.length
                        ? topStrengths.map((skill) => (
                          <span className="chip" key={skill}>{skill}</span>
                        ))
                        : <span className="chip">Belum ada skill terdeteksi</span>}
                    </div>
                  </div>

                  <div className="dashboard-skill-panel warm">
                    <span>Yang perlu dikejar</span>
                    <div className="chip-row">
                      {topGaps.length
                        ? topGaps.map((gap) => (
                          <span className="chip ghost" key={gap}>{gap}</span>
                        ))
                        : <span className="chip ghost">Tidak ada gap prioritas</span>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="dashboard-section-block">
                <div className="dashboard-block-heading">
                  <span>Keputusan sistem</span>
                  <strong>
                    {quizResult ? 'Role final dari job match + mini quiz' : 'Belum ada keputusan akhir'}
                  </strong>
                </div>
                <p className="dashboard-block-copy">{dashboardDecisionSupportCopy}</p>

                <div className="dashboard-next-step-callout">
                  <span>Langkah pertama</span>
                  <p>
                    {`Ambil ${topGaps[0] || 'roadmap paling atas'} sebagai fokus awal untuk ${quizResult?.selectedRoleName || recommendedCareerName || bestMatch.name}, lalu simpan hasilnya sebagai bukti portofolio.`}
                  </p>
                </div>
              </section>
            </div>

            <div className="dashboard-bottom-grid">
              <section className="dashboard-section-block">
                <div className="dashboard-block-heading">
                  <span>Sinyal kebutuhan industri</span>
                  <strong>Fokus yang paling dicari</strong>
                </div>
                <div className="dashboard-signal-list">
                  {dashboardSignals.map((signal) => (
                    <strong key={signal}>{signal}</strong>
                  ))}
                </div>
              </section>
            </div>

            <div className="page-actions dashboard-actions">
              <button className="secondary-button" type="button" onClick={() => goToPage('quiz')}>
                Kembali ke Mini Quiz
              </button>
              <button className="primary-button" type="button" onClick={() => goToPage('cv', { force: true })}>
                Ulangi dari Upload CV
              </button>
            </div>
          </article>
        </section>

        <section className="insight-section" id="project-fit">
          <div className="insight-copy">
            <span className="section-kicker">Untuk semua pencari kerja</span>
            <h2>Siap bantu rencana kariermu</h2>
            <p>
              SkillMap membantu kamu membaca kekuatan dari CV, melihat gap skill yang perlu
              ditutup, dan memilih langkah belajar yang paling relevan sebelum melamar kerja.
            </p>
          </div>

          <div className="feature-panel">
            <div className="feature-module-list">
              <span>Fitur utama</span>
              {[
                'Ekstraksi skill dari CV',
                'Kuis adaptif',
                'Pemetaan skill gap',
                'Jalur belajar personal',
                'Insight dasbor'
              ].map((item) => (
                <div className="requirement-item" key={item}>
                  <Icon name="check" size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="site-footer" id="contact">
        <div>
          <strong>SkillMap</strong>
          <p>2026 SkillMap AI. Navigator pembelajaran keterampilan yang dipersonalisasi.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
