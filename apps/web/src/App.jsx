import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createCareerFitQuiz,
  createFinalCareerResult,
  createRecommendation,
  fetchCvHistory,
  fetchJobVacancies,
  fetchProfile,
  setAuthToken,
  submitQuiz,
  uploadCv
} from './api';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const defaultTargetRole = '';
const pendingAiRoleLabel = 'Menunggu hasil analisis';

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
    label: 'Peran atau posisi yang ingin dituju (opsional)',
    placeholder: 'Contoh: Frontend Developer, Data Analyst, Project Coordinator...',
    wide: true,
    required: false
  },
  {
    id: 'skills',
    label: 'Keterampilan atau pengalaman yang belum tertulis di CV',
    placeholder: 'Contoh: sedang belajar React, pernah koordinasi tim kecil, sedang membuat dasbor data...',
    wide: true,
    multiline: true
  },
  {
    id: 'profileSummary',
    label: 'Profil singkat tambahan',
    placeholder: 'Jelaskan konteks penting yang tidak masuk CV: tujuan karier, hal yang sedang dipelajari, minat peran, atau pengalaman informal.',
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
  { id: 'cv', number: '01', label: 'Unggah CV', title: 'Unggah CV PDF', description: 'Unggah CV sebagai sumber utama analisis.' },
  { id: 'biodata', number: '02', label: 'Profil Singkat', title: 'Profil singkat tambahan', description: 'Tambahkan informasi penting yang belum tertulis di CV.' },
  { id: 'matches', number: '03', label: 'Kecocokan Kerja', title: 'Rekomendasi pekerjaan', description: 'Lihat pekerjaan yang paling cocok berdasarkan persentase kecocokan.' },
  { id: 'quiz', number: '04', label: 'Kuis Singkat', title: 'Kuis singkat karier', description: 'Pilih tipe pekerjaan yang paling kamu minati untuk memvalidasi rekomendasi.' },
  { id: 'result', number: '05', label: 'Hasil', title: 'Kesimpulan akhir', description: 'Lihat hasil AI dari CV, kecocokan kerja, dan kuis singkat.' },
  { id: 'dashboard', number: '06', label: 'Dasbor', title: 'Dasbor pribadi', description: 'Lihat kesenjangan keterampilan, rencana belajar, dan langkah berikutnya.' }
];
const flowPageTotal = String(flowPages.length).padStart(2, '0');
const flowPageLookup = Object.fromEntries(flowPages.map((page) => [page.id, page]));
const getFlowPageNumber = (pageId) => flowPageLookup[pageId]?.number || '--';

const journeyCards = [
  {
    icon: 'scan',
    title: 'Masukkan CV kamu',
    description:
      'Unggah CV PDF. SkillMap akan membaca pengalaman dan kemampuan yang sudah tertulis di sana.',
    points: ['Mulai dari CV', 'Tidak perlu isi data panjang']
  },
  {
    icon: 'brain',
    title: 'Tambahkan cerita singkat',
    description:
      'Tulis hal penting yang belum ada di CV, seperti pekerjaan yang kamu incar atau kemampuan yang sedang dipelajari.',
    points: ['Ceritakan targetmu', 'Tambah konteks penting']
  },
  {
    icon: 'map',
    title: 'Lihat pekerjaan yang cocok',
    description:
      'SkillMap membandingkan CV kamu dengan beberapa pilihan pekerjaan, lalu menunjukkan mana yang paling cocok.',
    points: ['Pekerjaan paling cocok', 'Yang perlu ditingkatkan']
  },
  {
    icon: 'trend',
    title: 'Jawab kuis singkat',
    description:
      'Pilih jawaban yang paling sesuai dengan minatmu agar rekomendasi akhirnya lebih pas.',
    points: ['Sesuaikan minat', 'Pilih arah karier']
  },
  {
    icon: 'result',
    title: 'Dapatkan hasil akhir',
    description:
      'Kamu akan melihat pekerjaan yang disarankan, alasan singkat, dan fokus belajar berikutnya.',
    points: ['Rekomendasi jelas', 'Fokus belajar']
  },
  {
    icon: 'check',
    title: 'Ikuti rencana belajar',
    description:
      'Dasbor menampilkan kemampuan yang sudah kuat, kemampuan yang perlu dilatih, dan langkah belajar yang bisa langsung dicoba.',
    points: ['Lihat prioritas', 'Mulai belajar']
  }
];

function getPageFromHash() {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const pageId = window.location.hash.replace(/^#\/?/, '') || 'home';
  if (pageId === 'home') {
    return 'home';
  }

  if (pageId === 'auth' || pageId === 'profile' || pageId === 'history') {
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

function getAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}${window.location.pathname}#/profile`;
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
    return 'Pilih file CV terlebih dahulu.';
  }

  if (pageIndex > 1 && !guardState.isBiodataComplete) {
    return `Lengkapi profil singkat terlebih dahulu: ${formatMissingFields(guardState.missingBiodataFields)}.`;
  }

  if (pageIndex > 1 && !guardState.hasScannedCv) {
    return 'Jalankan analisis dari halaman profil singkat sebelum lanjut ke rekomendasi pekerjaan.';
  }

  if ((pageId === 'result' || pageId === 'dashboard') && !guardState.quizResult) {
    return 'Jawab kuis singkat terlebih dahulu sebelum membuka dasbor akhir.';
  }

  if (pageId === 'dashboard' && !guardState.finalResult) {
    return 'Lihat hasil akhir terlebih dahulu sebelum membuka dasbor.';
  }

  return '';
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
    expectedPosition && `Peran/posisi yang ingin dituju: ${expectedPosition}`,
    skills && `Keterampilan/pengalaman yang belum tertulis di CV: ${skills}`,
    profileSummary && `Profil singkat tambahan di luar CV: ${profileSummary}`,
    experience && `Catatan tambahan: ${experience}`
  ]
    .filter(Boolean)
    .join('\n');
}

function getRecommendationSourceLabel(source) {
  const labels = {
    user_input: 'Target pilihan pengguna',
    rule_based: 'Analisis keterampilan dari CV',
    hybrid: 'Analisis model dan keterampilan',
    model: 'Model AI',
    local_rules: 'Analisis keterampilan',
    external: 'Analisis SkillMap'
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

function formatJobDate(value) {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium'
    }).format(new Date(value));
  } catch {
    return '';
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

function clampPercentage(value, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(numberValue * 100) / 100));
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

function formatCareerName(value) {
  const text = String(value || '').trim().replace(/[-_]+/g, ' ');
  const acronymWords = new Set(['ai', 'api', 'hr', 'it', 'ml', 'qa', 'seo', 'sql', 'ui', 'ux']);

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (acronymWords.has(part.toLowerCase()) ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(' ');
}

function createCareerId(value, fallback) {
  const id = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return id || fallback;
}

function getArrayValue(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function getCareerRecommendationMatches(source = {}) {
  const rawRecommendations = getArrayValue(source.careerRecommendations, source.career_recommendations);

  return rawRecommendations
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const rawName = item.name || item.roleName || item.role || item.career || item.recommendedCareer || item.recommended_career;
      const name = formatCareerName(rawName || `Rekomendasi ${index + 1}`);
      const score = clampPercentage(
        item.matchScore ?? item.match_score ?? item.careerMatchScore ?? item.career_match_score ?? item.score,
        0
      );

      return {
        ...item,
        id: item.id || item.roleId || createCareerId(rawName, `career-recommendation-${index + 1}`),
        name,
        matchScore: score,
        matchedSkills: getArrayValue(item.matchedSkills, item.matched_skills, item.skillDimiliki, item.skill_dimiliki),
        missingSkills: getArrayValue(item.missingSkills, item.missing_skills, item.skillGap, item.skill_gap),
        requiredSkills: getArrayValue(item.requiredSkills, item.required_skills),
        recommendationSource: item.recommendationSource || item.recommendation_source || item.source,
        fromCareerRecommendations: true
      };
    })
    .filter(Boolean);
}

function mergeJobMatchLists(...lists) {
  const merged = [];
  const seen = new Set();

  lists.flat().forEach((match) => {
    if (!match || typeof match !== 'object') {
      return;
    }

    const name = match.name || match.roleName || match.role || match.career || match.recommendedCareer || match.recommended_career;
    const normalizedName = formatCareerName(name);
    const normalizedMatch = {
      ...match,
      id: match.id || match.roleId || createCareerId(normalizedName, `career-option-${merged.length + 1}`),
      name: normalizedName || pendingAiRoleLabel,
      matchScore: clampPercentage(
        match.matchScore ?? match.match_score ?? match.careerMatchScore ?? match.career_match_score ?? match.score,
        0
      )
    };
    const key = `${normalizedMatch.id || ''}:${normalizedMatch.name}`.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalizedMatch);
  });

  return merged;
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

function getMissingSkillBadges(match = {}) {
  const skills = getArrayValue(match.missingSkills, match.missing_skills, match.skillGap, match.skill_gap);
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

function getCareerReadinessLabel(score) {
  if (score >= 80) {
    return 'kuat';
  }
  if (score >= 60) {
    return 'cukup siap';
  }
  if (score >= 40) {
    return 'perlu diperkuat';
  }
  return 'masih rendah';
}

function formatSkillPreview(skills, fallback) {
  if (!skills.length) {
    return fallback;
  }

  if (skills.length <= 3) {
    return skills.join(', ');
  }

  return `${skills.slice(0, 3).join(', ')}, dan ${skills.length - 3} skill lainnya`;
}

function getAlternativeCareerSummary(match = {}) {
  const score = clampPercentage(match.matchScore ?? match.score, 0);
  const matchedSkills = getMatchedSkillBadges(match);
  const missingSkills = getMissingSkillBadges(match);
  const readinessLabel = getCareerReadinessLabel(score);
  const sourceLabel = match.recommendationSource ? getRecommendationSourceLabel(match.recommendationSource) : 'Analisis keterampilan dari CV';
  const skillText = matchedSkills.length
    ? ` Skill cocok: ${formatSkillPreview(matchedSkills, '')}.`
    : (missingSkills.length
      ? ` Skill yang perlu ditingkatkan: ${formatSkillPreview(missingSkills, '')}.`
      : '');

  return `Kamu memiliki kecocokan ${score}% (${readinessLabel}) untuk posisi ${match.name}. ${sourceLabel}.${skillText}`;
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
          Buka kursus
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
  auth: { number: 'Akun', label: 'Masuk / Daftar', title: 'Masuk ke SkillMap', description: 'Masuk untuk menyimpan hasil analisis CV dan membuka riwayatnya kapan saja.' },
  profile: { number: 'Profil', label: 'Profil', title: 'Profil akun', description: 'Lihat informasi akun dan ringkasan aktivitas kamu.' },
  history: { number: 'Riwayat', label: 'Riwayat CV', title: 'Riwayat analisis CV', description: 'Lihat hasil analisis CV yang pernah tersimpan.' }
};

function App() {
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
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
  const [quizStatusMessage, setQuizStatusMessage] = useState('');
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [cvHistory, setCvHistory] = useState([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [jobVacancies, setJobVacancies] = useState([]);
  const [isJobVacanciesLoading, setIsJobVacanciesLoading] = useState(false);
  const [jobVacanciesMessage, setJobVacanciesMessage] = useState('');

  const currentUser = session?.user || null;

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
  const rawJobMatches = mergeJobMatchLists(
    currentInsight.jobMatches || [],
    getCareerRecommendationMatches(currentInsight),
    analysis.jobMatches || [],
    getCareerRecommendationMatches(analysis)
  );
  const jobMatches = rawJobMatches.filter(hasActionableJobMatch);
  const shouldSkipCareerFitQuiz = hasScannedCv && jobMatches.length === 1;
  const hasSkippedCareerFitQuiz = Boolean(quizResult?.skipped);
  const bestMatch = jobMatches[0] || {
    id: analysis.suggestedRoleId || targetRole,
    name: analysis.targetRole || analysis.recommendedCareer || pendingAiRoleLabel,
    matchScore: analysis.readinessScore || 0,
    matchedSkills: analysis.extractedSkills || []
  };
  const rawRecommendedCareerName = currentInsight.recommendedCareer || currentInsight.recommended_career || analysis.recommendedCareer || analysis.recommended_career || '';
  const recommendedCareerName = bestMatch.name || rawRecommendedCareerName || pendingAiRoleLabel;
  const careerMatchScore = bestMatch.matchScore ?? currentInsight.careerMatchScore ?? currentInsight.career_match_score ?? analysis.careerMatchScore ?? analysis.career_match_score ?? currentInsight.readinessScore ?? 0;
  const careerGapScore = bestMatch.gapScore ?? bestMatch.gap_score ?? Math.max(0, 100 - careerMatchScore);
  const recommendationSource = bestMatch.recommendationSource || currentInsight.recommendationSource || currentInsight.recommendation_source || analysis.recommendationSource || analysis.recommendation_source || '';
  const recommendationSourceLabel = getRecommendationSourceLabel(recommendationSource);
  const scanJobMatches = mergeJobMatchLists(
    analysis.jobMatches || [],
    getCareerRecommendationMatches(analysis)
  ).filter(hasActionableJobMatch);
  const rawScanRecommendedCareerName = analysis.recommendedCareer || analysis.recommended_career || '';
  const normalizedScanCareerName = rawScanRecommendedCareerName.toLowerCase();
  const scanBestMatch = scanJobMatches.find((match) => (
    (normalizedScanCareerName && String(match.name || '').toLowerCase() === normalizedScanCareerName)
    || match.id === analysis.suggestedRoleId
    || match.id === analysis.targetRoleId
  )) || scanJobMatches[0] || {
    id: analysis.suggestedRoleId || analysis.targetRoleId || targetRole,
    name: analysis.targetRole || analysis.recommendedCareer || pendingAiRoleLabel,
    matchScore: analysis.readinessScore || 0,
    matchedSkills: analysis.extractedSkills || []
  };
  const scanRecommendedCareerName = rawScanRecommendedCareerName || scanBestMatch.name || pendingAiRoleLabel;
  const scanCareerMatchScore = analysis.careerMatchScore ?? analysis.career_match_score ?? scanBestMatch.careerMatchScore ?? scanBestMatch.career_match_score ?? scanBestMatch.matchScore ?? analysis.readinessScore ?? 0;
  const scanCareerGapScore = analysis.gapScore ?? analysis.gap_score ?? scanBestMatch.gapScore ?? scanBestMatch.gap_score ?? Math.max(0, 100 - scanCareerMatchScore);
  const scanRecommendationSource = analysis.recommendationSource || analysis.recommendation_source || scanBestMatch.recommendationSource || '';
  const scanRecommendationSourceLabel = getRecommendationSourceLabel(scanRecommendationSource);
  const scanSummary = analysis.summary || scanBestMatch.summary || analysis.careerRecommendation?.summary || '';
  const scanAlternativeCareerMatches = scanJobMatches.filter((match) => {
    const matchName = String(match.name || '').toLowerCase();
    const matchId = String(match.id || '').toLowerCase();
    return (
      matchId !== String(scanBestMatch.id || '').toLowerCase()
      && matchId !== String(analysis.suggestedRoleId || '').toLowerCase()
      && matchName !== normalizedScanCareerName
      && matchName !== String(scanRecommendedCareerName || '').toLowerCase()
    );
  });
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
        title: course.skill ? `Pelajari ${course.skill}` : (course.title || `Rencana belajar ${index + 1}`),
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
      : [...topGaps, ...topStrengths]
  ).slice(0, 5);
  const dashboardTrackLabel = recommendationSource ? recommendationSourceLabel : (hasSkippedCareerFitQuiz ? 'Rekomendasi tunggal' : (quizResult ? 'Jalur paling cocok' : 'Wawasan awal'));
  const dashboardDecisionTitle = finalResult?.recommendedRoleName || recommendedCareerName || quizResult?.selectedRoleName || careerRecommendation?.title || bestMatch.name || pendingAiRoleLabel;
  const dashboardDecisionCopy = finalResult?.summary || currentInsight.summary || quizResult?.recommendation || careerRecommendation?.summary || analysis.businessGoal;
  const dashboardDecisionSupportCopy = hasSkippedCareerFitQuiz
    ? (finalResult?.quizSummary || 'Kuis singkat dilewati karena rekomendasi pekerjaan sudah tunggal dari hasil analisis.')
    : quizResult
      ? (finalResult?.quizSummary || `Kuis singkat menguatkan arah ${quizResult.selectedRoleName || dashboardDecisionTitle} berdasarkan tipe pekerjaan yang kamu pilih.`)
    : 'Jawaban kuis singkat akan membantu memilih peran yang paling kamu minati dari daftar rekomendasi.';
  const activePage = standalonePages[currentPage] || flowPages.find((page) => page.id === currentPage) || flowPages[0];
  const isFlowPage = flowPages.some((page) => page.id === currentPage);
  const accountTargetPage = currentUser
    ? (currentPage === 'profile' ? 'history' : 'profile')
    : 'auth';
  const accountButtonLabel = currentUser
    ? (currentPage === 'profile' ? 'Riwayat' : 'Profil')
    : 'Masuk';
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
    shouldSkipCareerFitQuiz,
    missingBiodataFields
  };
  const navigationGuardRef = useRef(navigationGuard);
  navigationGuardRef.current = navigationGuard;

  const getPageBlockMessage = (pageId) => getPageBlockMessageForState(pageId, navigationGuard);
  const clearStatusMessage = () => setStatusMessage('');
  const clearQuizStatusMessage = () => setQuizStatusMessage('');

  const goToPage = (pageId, options = {}) => {
    if (pageId === 'quiz' && shouldSkipCareerFitQuiz && !options.force) {
      const fallbackPage = finalResult ? 'result' : 'matches';
      setCurrentPage(fallbackPage);
      clearStatusMessage();
      if (window.location.hash !== `#/${fallbackPage}`) {
        window.history.pushState(null, '', `#/${fallbackPage}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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
          const fallbackPage = shouldSkipCareerFitQuiz ? 'matches' : 'quiz';
          setCurrentPage(fallbackPage);
          window.history.pushState(null, '', `#/${fallbackPage}`);
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
      setAuthMessage(error.response?.data?.error || 'Riwayat belum bisa dimuat. Coba muat ulang beberapa saat lagi.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const loadJobVacanciesForRole = async (roleName) => {
    const normalizedRoleName = String(roleName || '').trim();
    if (!normalizedRoleName) {
      setJobVacancies([]);
      setJobVacanciesMessage('');
      return;
    }

    setIsJobVacanciesLoading(true);
    setJobVacanciesMessage('');

    try {
      const response = await fetchJobVacancies(normalizedRoleName, '', 6);
      const jobs = response.data.jobs || [];
      setJobVacancies(jobs);
      setJobVacanciesMessage(jobs.length ? '' : 'Belum ada loker remote yang cocok untuk rekomendasi ini.');
    } catch (error) {
      setJobVacancies([]);
      setJobVacanciesMessage(error.response?.data?.error || 'Info loker belum bisa dimuat saat ini.');
    } finally {
      setIsJobVacanciesLoading(false);
    }
  };

  const handleAuthFieldChange = (field, value) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
    setAuthMessage('');
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Fitur masuk belum siap. Kamu tetap bisa lanjut analisis CV tanpa masuk.');
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
              emailRedirectTo: getAuthRedirectUrl(),
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

      if (nextPage === 'quiz' && guardState.shouldSkipCareerFitQuiz) {
        const fallbackPage = guardState.finalResult ? 'result' : 'matches';
        clearStatusMessage();
        setCurrentPage(fallbackPage);
        window.history.replaceState(null, '', `#/${fallbackPage}`);
      } else if (blockedMessage) {
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
          const fallbackPage = guardState.shouldSkipCareerFitQuiz ? 'matches' : 'quiz';
          setCurrentPage(fallbackPage);
          window.history.replaceState(null, '', `#/${fallbackPage}`);
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
    setJobVacancies([]);
    setJobVacanciesMessage('');
    setMiniQuizAnswer({});
    clearQuizStatusMessage();
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
    setStatusMessage('Analisis sedang diproses. Mohon tunggu sebentar.');
    clearQuizStatusMessage();

    try {
      const profileText = formatBiodataText(biodata);
      const response = await uploadCv(file, 'technology', targetRole, profileText, '');
      const nextAnalysisJobMatches = mergeJobMatchLists(
        response.data.jobMatches || [],
        getCareerRecommendationMatches(response.data)
      ).filter(hasActionableJobMatch);
      const nextAnalysis = {
        ...response.data,
        jobMatches: nextAnalysisJobMatches
      };
      setAnalysis(nextAnalysis);
      setExtractedCvText(response.data.extractedCvText || '');
      setRecommendation(null);
      setQuizResult(null);
      setFinalResult(null);
      setJobVacancies([]);
      setJobVacanciesMessage('');
      setMiniQuizAnswer({});
      let nextCareerFitQuiz = null;
      let nextQuizStatusMessage = '';
      if ((nextAnalysis.jobMatches || []).length === 1) {
        nextQuizStatusMessage = 'Kuis singkat dilewati karena rekomendasi pekerjaan sudah tunggal.';
      } else {
        try {
          const quizResponse = await createCareerFitQuiz({
            jobMatches: nextAnalysis.jobMatches || [],
            extractedSkills: nextAnalysis.extractedSkills || [],
            skillDimiliki: nextAnalysis.skillDimiliki || [],
            skillGap: nextAnalysis.skillGap || [],
            targetRole: nextAnalysis.suggestedRoleId || nextAnalysis.targetRoleId || targetRole,
            recommendedCareer: nextAnalysis.recommendedCareer,
            aiSource: nextAnalysis.aiSource
          });
          const backendQuiz = quizResponse.data.question || null;
          nextCareerFitQuiz = getCareerFitQuestions(backendQuiz).length ? backendQuiz : null;
          if (!nextCareerFitQuiz) {
            nextQuizStatusMessage = 'Kuis singkat belum tersedia untuk hasil ini. Coba lagi beberapa saat lagi.';
          }
        } catch (quizError) {
          nextQuizStatusMessage = quizError.response?.data?.error || 'Kuis singkat belum bisa dibuat saat ini.';
        }
      }
      setCareerFitQuiz(nextCareerFitQuiz);
      setQuizStatusMessage(nextQuizStatusMessage);
      setHasScannedCv(true);
      if (currentUser) {
        loadProfileData();
      }
      if (response.data.suggestedRoleId) {
        setTargetRole(response.data.suggestedRoleId);
      }
      goToPage('matches', { force: true });
      clearStatusMessage();
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
        setStatusMessage('CV hanya bisa diunggah dalam format PDF (.pdf).');
        event.target.value = '';
        goToPage('cv');
        return;
      }

      setSelectedCvFile(file);
      setHasScannedCv(false);
      setRecommendation(null);
      setQuizResult(null);
      setFinalResult(null);
      setJobVacancies([]);
      setJobVacanciesMessage('');
      setMiniQuizAnswer({});
      setCareerFitQuiz(null);
      clearQuizStatusMessage();
      setExtractedCvText('');
      setShowCvErrors(false);
      clearStatusMessage();
      goToPage('biodata');
      event.target.value = '';
    }
  };

  const startNewAnalysisSession = () => {
    setBiodata(initialBiodata);
    setIsBiodataSaved(false);
    setHasScannedCv(false);
    setMiniQuizAnswer({});
    setCareerFitQuiz(null);
    clearQuizStatusMessage();
    setAnalysis(emptyAnalysis);
    setQuizResult(null);
    setFinalResult(null);
    setRecommendation(null);
    setJobVacancies([]);
    setJobVacanciesMessage('');
    setIsJobVacanciesLoading(false);
    setExtractedCvText('');
    setSelectedCvFile(null);
    setShowBiodataErrors(false);
    setShowCvErrors(false);
    setIsUploading(false);
    setIsSubmittingQuiz(false);
    setTargetRole(defaultTargetRole);
    clearStatusMessage();
  };

  const completeCareerAssessment = async ({
    selectedMatch,
    selectedRoleId,
    selectedRoleName,
    selectedCareerOption = null,
    quizScore,
    quizAnswers = [],
    skippedQuiz = false
  }) => {
    const finalSelectedRoleName = selectedRoleName || selectedMatch.name || selectedCareerOption?.label || recommendedCareerName;
    const finalQuizScore = clampPercentage(quizScore, 0);
    const adjustedJobMatches = jobMatches
      .map((match) => {
        if (match.id !== selectedRoleId) {
          return match;
        }

        if (skippedQuiz) {
          return {
            ...match,
            singleRecommendation: true
          };
        }

        return {
          ...match,
          matchScore: Math.min(96, Math.max(match.matchScore || 0, finalQuizScore)),
          quizSignal: true
        };
      })
      .sort((first, second) => (second.matchScore || 0) - (first.matchScore || 0));
    const quizData = {
      score: finalQuizScore,
      track: skippedQuiz ? 'rekomendasi-tunggal' : 'career-fit',
      selectedRoleId,
      selectedRoleName: finalSelectedRoleName,
      selectedResponse: selectedCareerOption?.response || 'Rekomendasi tunggal dari hasil analisis',
      skipped: skippedQuiz,
      recommendation: skippedQuiz
        ? `Hasil akhir mengikuti ${finalSelectedRoleName} karena hanya ada satu rekomendasi pekerjaan dari analisis CV.`
        : `Kuis singkat menguatkan arah ${finalSelectedRoleName}. Fokuskan rencana belajar pada bukti yang relevan dengan pilihan ini.`
    };

    setQuizResult(quizData);
    setTargetRole(selectedRoleId);
    if (!skippedQuiz) {
      submitQuiz({
        ...quizData,
        answers: quizAnswers,
        targetRole: selectedRoleId,
        targetRoleName: finalSelectedRoleName,
        recommendedCareer: analysis.recommendedCareer,
        jobMatches: adjustedJobMatches.slice(0, 5).map((match) => ({
          id: match.id,
          name: match.name,
          matchScore: match.matchScore,
          matchedSkills: match.matchedSkills || [],
          missingSkills: match.missingSkills || [],
          requiredSkills: match.requiredSkills || []
        }))
      })
        .then(() => {
          if (currentUser) {
            loadProfileData();
          }
        })
        .catch((historyError) => {
          console.warn('Quiz history save failed:', historyError);
        });
    }

    const recommendationResponse = await createRecommendation({
      targetRole: selectedRoleId,
      extractedSkills: analysis.skillDimiliki?.length ? analysis.skillDimiliki : analysis.extractedSkills,
      quizScore: finalQuizScore
    });
    const nextRecommendation = {
      ...recommendationResponse.data,
      extractedSkills: analysis.extractedSkills,
      skillDimiliki: analysis.skillDimiliki,
      jobMatches: adjustedJobMatches,
      suggestedRoleId: selectedRoleId,
      selectedCareerSignal: selectedCareerOption,
      quizSkipped: skippedQuiz
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
        score: finalQuizScore,
        selectedRoleId,
        selectedRoleName: finalSelectedRoleName,
        answers: quizAnswers,
        skipped: skippedQuiz
      }
    });
    setFinalResult(finalResponse.data);
    loadJobVacanciesForRole(finalResponse.data?.recommendedRoleName || finalSelectedRoleName);
    clearStatusMessage();
    goToPage('result', { force: true });
  };

  const handleSkipQuizSubmit = async () => {
    if (!shouldSkipCareerFitQuiz || !jobMatches.length) {
      goToPage('quiz');
      return;
    }

    if (finalResult && hasSkippedCareerFitQuiz) {
      goToPage('result', { force: true });
      return;
    }

    setIsSubmittingQuiz(true);
    clearStatusMessage();

    try {
      const selectedMatch = jobMatches[0] || bestMatch;
      const selectedRoleId = selectedMatch.id || analysis.suggestedRoleId || targetRole;
      const selectedRoleName = selectedMatch.name || recommendedCareerName;
      const baseScore = selectedMatch.matchScore ?? analysis.readinessScore ?? careerMatchScore;
      await completeCareerAssessment({
        selectedMatch,
        selectedRoleId,
        selectedRoleName,
        quizScore: baseScore,
        quizAnswers: [],
        skippedQuiz: true
      });
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.message || 'Hasil akhir belum bisa dibuat. Silakan coba lagi.');
    } finally {
      setIsSubmittingQuiz(false);
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
      const selectedRoleName = selectedMatch.name || selectedCareerOption.label;
      const baseScore = clampPercentage(selectedMatch.matchScore ?? analysis.readinessScore ?? 0, 0);
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

      await completeCareerAssessment({
        selectedMatch,
        selectedRoleId,
        selectedRoleName,
        selectedCareerOption,
        quizScore,
        quizAnswers,
        skippedQuiz: false
      });
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.message || 'Pengiriman kuis gagal. Silakan coba lagi.');
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
          <nav className="site-nav" aria-label="Navigasi halaman utama">
            <button className="active" type="button" onClick={() => goToHomeSection('home')}>
              Beranda
            </button>
            <button type="button" onClick={() => goToHomeSection('features')}>
              Cara Pakai
            </button>
            <button type="button" onClick={() => goToHomeSection('project-fit')}>
              Manfaat
            </button>
          </nav>
        ) : (
          <div className="header-step-summary" aria-live="polite">
            {isFlowPage && <span>Langkah {activePage.number} / {flowPageTotal}</span>}
            <strong>{activePage.label}</strong>
          </div>
        )}

        <div className="header-actions">
          <button
            className="nav-cta"
            type="button"
            onClick={() => {
              if (currentPage === 'home') {
                startNewAnalysisSession();
              }
              goToPage(currentPage === 'home' ? 'cv' : 'home', { force: true });
            }}
          >
            {currentPage === 'home' ? 'Mulai Sekarang' : 'Beranda'}
          </button>
          <button
            className="account-button"
            type="button"
            onClick={() => goToPage(accountTargetPage, { force: true })}
          >
            {accountButtonLabel}
          </button>
        </div>
      </header>

      <main>
        <section className="account-section auth-section">
          <div className="section-heading compact">
            <span className="page-counter">Akun</span>
            <h2>{authMode === 'sign-up' ? 'Daftar akun SkillMap' : 'Masuk ke SkillMap'}</h2>
            <p>Simpan hasil analisis CV dan buka kembali riwayatnya dari halaman profil.</p>
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
                  Masuk
                </button>
                <button
                  className={authMode === 'sign-up' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setAuthMode('sign-up');
                    setAuthMessage('');
                  }}
                >
                  Daftar
                </button>
              </div>

              {!isSupabaseConfigured && (
                <p className="auth-warning">
                  Fitur masuk belum siap. Kamu tetap bisa lanjut analisis CV tanpa masuk.
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
                <label className="field-label" htmlFor="auth-password">Kata sandi</label>
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
              <h3>Setelah masuk, setiap hasil analisis CV akan tersimpan di riwayat kamu.</h3>
              <p className="panel-helper">
                Masuk agar hasil analisis CV kamu tersimpan dan bisa dibuka lagi kapan saja.
              </p>
              <button className="secondary-button" type="button" onClick={() => goToPage('cv', { force: true })}>
                Lanjut analisis tanpa membuka profil
              </button>
            </article>
          </div>
        </section>

        <section className="account-section profile-section">
          <div className="section-heading compact">
            <h2>Profil akun</h2>
            <p>Lihat informasi akun dan ringkasan aktivitas kamu.</p>
          </div>

          {!currentUser ? (
            <article className="account-panel profile-empty">
              <h3>Masuk terlebih dahulu untuk melihat profil.</h3>
              <p className="panel-helper">Profil hanya bisa ditampilkan setelah kamu masuk.</p>
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
                    <span>Analisis CV</span>
                  </div>
                  <div>
                    <strong>{profileData?.stats?.quizAttemptCount ?? 0}</strong>
                    <span>Kuis</span>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="secondary-button" type="button" onClick={loadProfileData} disabled={isProfileLoading}>
                    {isProfileLoading ? 'Memuat...' : 'Muat ulang'}
                  </button>
                  <button className="primary-button" type="button" onClick={handleSignOut}>
                    Keluar
                  </button>
                </div>
              </aside>
            </div>
          )}
        </section>

        <section className="account-section history-section">
          <div className="section-heading compact">
            <h2>Riwayat analisis CV</h2>
            <p>Lihat kembali hasil analisis CV yang pernah kamu simpan.</p>
          </div>

          {!currentUser ? (
            <article className="account-panel profile-empty">
              <h3>Masuk terlebih dahulu untuk melihat riwayat.</h3>
              <p className="panel-helper">Riwayat analisis CV hanya bisa ditampilkan setelah kamu masuk.</p>
              <button className="primary-button" type="button" onClick={() => goToPage('auth', { force: true })}>
                Masuk / Daftar
              </button>
            </article>
          ) : (
            <div className="history-page-grid">
              <section className="account-panel history-panel">
                <div className="history-heading">
                  <div>
                    <span className="panel-label">Riwayat CV</span>
                    <h3>Analisis terbaru</h3>
                  </div>
                  <div className="history-heading-actions">
                    <button className="secondary-button" type="button" onClick={() => goToPage('profile', { force: true })}>
                      Kembali ke Profil
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        startNewAnalysisSession();
                        goToPage('cv', { force: true });
                      }}
                    >
                      Analisis CV baru
                    </button>
                  </div>
                </div>

                {isProfileLoading ? (
                  <p className="empty-state-text">Memuat riwayat...</p>
                ) : cvHistory.length ? (
                  <div className="history-list">
                    {cvHistory.map((item) => {
                      const scanAnalysis = item.analysis || {};
                      const scanMatch = scanAnalysis.jobMatches?.[0] || {};
                      const scanScore = scanAnalysis.readinessScore || scanMatch.matchScore || 0;
                      const scanRole = scanAnalysis.targetRole || scanMatch.name || 'Peran belum tersedia';
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
                            <span>cocok</span>
                          </div>
                          <div className="chip-row">
                            {scanSkills.length
                              ? scanSkills.map((skill) => <span className="chip" key={skill}>{skill}</span>)
                              : <span className="chip ghost">Keterampilan belum tersedia</span>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state-text">Belum ada riwayat analisis CV untuk akun ini.</p>
                )}
              </section>
            </div>
          )}
        </section>

        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <Icon name="spark" size={14} />
              Bantu pilih arah karier
            </span>
            <h1>SkillMap</h1>
            <p className="hero-lede">
              Masukkan CV kamu, lalu SkillMap bantu menunjukkan pekerjaan yang cocok,
              kemampuan yang perlu dilatih, dan langkah belajar yang bisa kamu mulai.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  startNewAnalysisSession();
                  goToPage('cv', { force: true });
                }}
              >
                <Icon name="play" size={17} />
                Mulai dari CV
              </button>
            </div>
          </div>

        </section>

        <section className="journey-section" id="features">
          <div className="section-heading">
            <h2>Cara Pakai SkillMap</h2>
            <p>
              Mulai dari CV, tambahkan sedikit cerita tentang tujuanmu, lalu lihat pekerjaan yang cocok
              dan rencana belajar yang bisa langsung diikuti.
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
                {isUploading ? 'Menganalisis CV...' : 'Analisis CV & Lihat Rekomendasi'}
              </button>
            </article>

            <article className="workspace-panel cv-panel">
              <div className="panel-label">{getFlowPageNumber('cv')} / Unggah CV</div>
              <h3>Unggah CV PDF terlebih dahulu</h3>
              <p className="panel-helper">
                CV menjadi sumber utama analisis. Setelah file masuk, baru tambahkan profil singkat untuk hal yang tidak tertulis di CV.
              </p>
              <div className="profile-use-note">
                <span>Urutan baru</span>
                <p>Unggah CV PDF, isi profil singkat tambahan, jalankan analisis AI, lalu lihat rekomendasi pekerjaan.</p>
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
                {isUploading ? 'AI sedang menganalisis...' : selectedCvFile ? 'Ganti file CV PDF' : 'Unggah file CV PDF'}
              </label>
              {selectedCvFile && (
                <p className="selected-file">File siap: {selectedCvFile.name}</p>
              )}
              {showCvErrors && !selectedCvFile && (
                <p className="field-error cv-file-error">CV PDF wajib diunggah sebelum lanjut.</p>
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
                  <span>Keterampilan yang dimiliki</span>
                  <div className="chip-row">
                    {displayedSkills.length
                      ? displayedSkills.map((skill) => (
                        <span className="chip" key={skill}>{skill}</span>
                      ))
                      : <span className="chip">Belum ada keterampilan yang cocok</span>}
                  </div>
                </div>
              )}

              {hasScannedCv && (
                <div className="result-block">
                  <span>Prioritas pengembangan</span>
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
                  : 'Jalankan analisis CV untuk melihat hasil personal.'}
              </p>

              <div className="top-match-card">
                <span>Rekomendasi utama berdasarkan hasil analisis</span>
                <strong>{scanRecommendedCareerName}</strong>
                <p>{scanCareerMatchScore}% kecocokan, kesenjangan {scanCareerGapScore}%</p>
                {scanRecommendationSource && <small>{scanRecommendationSourceLabel}</small>}
                {scanSummary && (
                  <p>{scanSummary}</p>
                )}
              </div>

              <div className="career-options-heading">
                <span>Opsi karier relevan lainnya</span>
                <strong>{scanAlternativeCareerMatches.length} opsi</strong>
              </div>
              <div className="match-list">
                {scanAlternativeCareerMatches.map((match) => {
                  const matchedSkillBadges = getMatchedSkillBadges(match);
                  const missingSkillBadges = getMissingSkillBadges(match);
                  const optionSource = match.recommendationSource ? getRecommendationSourceLabel(match.recommendationSource) : '';

                  return (
                    <div className="match-row" key={match.id || match.name}>
                      <div>
                        <strong>{match.name}</strong>
                        <p className="match-summary-copy">{getAlternativeCareerSummary(match)}</p>
                        {optionSource && <small className="match-source-pill">{optionSource}</small>}
                        {matchedSkillBadges.length > 0 && (
                          <div className="match-skill-badges" aria-label={`Keterampilan cocok untuk ${match.name}`}>
                            {matchedSkillBadges.map((skill) => (
                              <span className="match-skill-badge" key={`${match.id || match.name}-${skill}`}>{skill}</span>
                            ))}
                          </div>
                        )}
                        {!matchedSkillBadges.length && missingSkillBadges.length > 0 && (
                          <div className="match-skill-badges" aria-label={`Skill yang perlu ditingkatkan untuk ${match.name}`}>
                            {missingSkillBadges.slice(0, 4).map((skill) => (
                              <span className="match-skill-badge ghost" key={`${match.id || match.name}-${skill}`}>{skill}</span>
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
                {!scanAlternativeCareerMatches.length && (
                  <p className="career-options-empty">
                    {hasScannedCv
                      ? 'Belum ada opsi karier lain yang cukup relevan dari hasil analisis ini.'
                      : 'Opsi karier lain akan muncul setelah analisis CV selesai.'}
                  </p>
                )}
              </div>

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('biodata', { force: true })}>
                  Kembali ke Profil Singkat
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={shouldSkipCareerFitQuiz ? handleSkipQuizSubmit : () => goToPage('quiz')}
                  disabled={shouldSkipCareerFitQuiz ? isSubmittingQuiz : activeCareerFitQuestions.length === 0}
                >
                  {shouldSkipCareerFitQuiz
                    ? (isSubmittingQuiz ? 'Menyiapkan Hasil...' : 'Lanjut Hasil Akhir')
                    : 'Lanjut Kuis Singkat'}
                </button>
              </div>
              {quizStatusMessage && (
                <p className="quiz-status-note">{quizStatusMessage}</p>
              )}
            </article>

            <article className="workspace-panel quiz-panel">
              <div className="panel-label">{getFlowPageNumber('quiz')} / Kuis Singkat</div>
              <h3>Pilih arah yang paling kamu minati</h3>
              <p className="panel-copy">{answeredCount} dari {activeCareerFitQuestions.length} pertanyaan terjawab</p>
              <div className="progress-track" aria-label={`Progres kuis ${quizProgress}%`}>
                <span style={{ width: `${quizProgress}%` }} />
              </div>
              <p className="panel-helper">
                Opsi di bawah dibuat dari rekomendasi pekerjaan hasil analisis CV untuk memastikan arah yang paling kamu minati.
              </p>

              {activeCareerFitQuestions.map((question, questionIndex) => {
                const questionId = getCareerFitQuestionId(question, questionIndex);

                return (
                  <div className="mini-quiz-card" key={questionId}>
                    <span>{questionIndex === 0 ? (activeCareerFitQuiz.context || 'Peran yang dibandingkan berasal dari hasil analisis CV.') : `Pertanyaan ${questionIndex + 1}`}</span>
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
                <p className="empty-state-text">
                  {shouldSkipCareerFitQuiz
                    ? 'Kuis singkat dilewati karena rekomendasi pekerjaan sudah tunggal.'
                    : 'Kuis singkat belum tersedia untuk hasil analisis ini.'}
                </p>
              )}

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('matches', { force: true })}>
                  Kembali ke Rekomendasi
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={shouldSkipCareerFitQuiz ? handleSkipQuizSubmit : handleQuizSubmit}
                  disabled={isSubmittingQuiz || (!shouldSkipCareerFitQuiz && (activeCareerFitQuestions.length === 0 || answeredCount < activeCareerFitQuestions.length))}
                >
                  {isSubmittingQuiz
                    ? 'Menyiapkan...'
                    : (shouldSkipCareerFitQuiz ? 'Lihat Hasil Akhir' : 'Lihat Hasil')}
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
                {hasSkippedCareerFitQuiz
                  ? 'Hasil ini menggabungkan isi CV dan rekomendasi pekerjaan tunggal dari analisis.'
                  : 'Hasil ini menggabungkan isi CV, rekomendasi pekerjaan dari analisis, dan pola jawaban kuis singkat.'}
              </p>

              <div className="final-result-card">
                <span>Rekomendasi pekerjaan akhir</span>
                <strong>{finalResult?.recommendedRoleName || recommendedCareerName || quizResult?.selectedRoleName || bestMatch.name}</strong>
                <p>{finalResult?.summary || currentInsight.summary || quizResult?.recommendation || careerRecommendation?.summary || 'Hasil akhir belum tersedia.'}</p>
              </div>

              <div className="result-summary-grid">
                <section className="result-summary-block">
                  <span>Ringkasan CV</span>
                  <p>{finalResult?.cvSummary || (topStrengths.length ? `Keterampilan terdeteksi: ${topStrengths.join(', ')}.` : 'Belum ada keterampilan spesifik yang terdeteksi dari CV.')}</p>
                </section>
                <section className="result-summary-block">
                  <span>Saran pekerjaan</span>
                  <p>{finalResult?.jobMatchSummary || `${recommendedCareerName} muncul dengan kecocokan ${careerMatchScore}% dan kesenjangan ${careerGapScore}%.`}</p>
                </section>
                <section className="result-summary-block">
                  <span>{hasSkippedCareerFitQuiz ? 'Validasi rekomendasi' : 'Kuis singkat'}</span>
                  <p>
                    {finalResult?.quizSummary || (
                      hasSkippedCareerFitQuiz
                        ? 'Kuis singkat dilewati karena rekomendasi pekerjaan sudah tunggal.'
                        : `${answeredCount} jawaban sudah dipakai sebagai validasi minat.`
                    )}
                  </p>
                </section>
              </div>

              <section className="result-summary-block job-vacancy-block">
                <div className="job-vacancy-heading">
                  <div>
                    <span>Info loker terkait</span>
                    <strong>{finalResult?.recommendedRoleName || recommendedCareerName || 'Rekomendasi akhir'}</strong>
                  </div>
                  <small>{isJobVacanciesLoading ? 'Memuat...' : `${jobVacancies.length} loker`}</small>
                </div>

                {jobVacancies.length > 0 && (
                  <div className="job-vacancy-list">
                    {jobVacancies.map((job) => {
                      const postedDate = formatJobDate(job.postedAt);

                      return (
                        <article className="job-vacancy-card" key={job.id || job.url || `${job.title}-${job.company}`}>
                          <div>
                            <span>{job.source || 'Job board'}</span>
                            <strong>{job.title}</strong>
                            <p>{job.company} - {job.location || 'Remote'}</p>
                          </div>
                          <div className="job-vacancy-meta">
                            {job.type && <small>{job.type}</small>}
                            {job.level && <small>{job.level}</small>}
                            {postedDate && <small>{postedDate}</small>}
                            {job.salary && <small>{job.salary}</small>}
                          </div>
                          {job.excerpt && <p>{job.excerpt}</p>}
                          {job.url && (
                            <a
                              className="job-vacancy-link"
                              href={job.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => openCourse(event, job.url)}
                            >
                              Buka lowongan
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {!jobVacancies.length && (
                  <p className="job-vacancy-empty">
                    {isJobVacanciesLoading
                      ? 'Sedang mencari loker remote yang sesuai dengan rekomendasi akhir.'
                      : (jobVacanciesMessage || 'Info loker akan muncul setelah hasil akhir tersedia.')}
                  </p>
                )}
              </section>

              <div className="result-summary-block">
                <span>Fokus rencana belajar</span>
                <div className="chip-row">
                  {(finalResult?.nextFocus?.length ? finalResult.nextFocus : topGaps).length
                    ? (finalResult?.nextFocus?.length ? finalResult.nextFocus : topGaps).map((focus) => (
                      <span className="chip ghost" key={focus}>{focus}</span>
                    ))
                    : <span className="chip ghost">Tidak ada prioritas pengembangan</span>}
                </div>
              </div>

              <div className="course-list result-course-list">
                {courseRecommendations.slice(0, 3).map((course) => (
                  <CourseItem course={course} key={`${course.skill}-${course.title}`} />
                ))}
              </div>

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage(hasSkippedCareerFitQuiz ? 'matches' : 'quiz', { force: true })}>
                  {hasSkippedCareerFitQuiz ? 'Kembali ke Rekomendasi' : 'Kembali ke Kuis Singkat'}
                </button>
                <button className="primary-button" type="button" onClick={() => goToPage('dashboard')}>
                  Lanjut Dasbor
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
                  <span>{expectedPositionText || 'Target peran belum diisi'}</span>
                  <span>{dashboardTrackLabel}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-content-grid">
              <section className="dashboard-section-block dashboard-roadmap-card">
                <div className="dashboard-block-heading">
                  <span>Rencana belajar</span>
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
                            Buka rencana belajar: {step.course.title}
                          </a>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-state-text">Rencana belajar belum tersedia dari hasil analisis terakhir.</p>
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
                        : <span className="chip">Belum ada keterampilan terdeteksi</span>}
                    </div>
                  </div>

                  <div className="dashboard-skill-panel warm">
                    <span>Yang perlu dikejar</span>
                    <div className="chip-row">
                      {topGaps.length
                        ? topGaps.map((gap) => (
                          <span className="chip ghost" key={gap}>{gap}</span>
                        ))
                        : <span className="chip ghost">Tidak ada prioritas pengembangan</span>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="dashboard-section-block">
                <div className="dashboard-block-heading">
                  <span>Keputusan sistem</span>
                  <strong>
                    {hasSkippedCareerFitQuiz
                      ? 'Peran akhir dari rekomendasi kerja'
                      : (quizResult ? 'Peran akhir dari rekomendasi kerja dan kuis singkat' : 'Belum ada keputusan akhir')}
                  </strong>
                </div>
                <p className="dashboard-block-copy">{dashboardDecisionSupportCopy}</p>

                <div className="dashboard-next-step-callout">
                  <span>Langkah pertama</span>
                  <p>
                    {`Ambil ${topGaps[0] || 'rencana belajar paling atas'} sebagai fokus awal untuk ${quizResult?.selectedRoleName || recommendedCareerName || bestMatch.name}, lalu simpan hasilnya sebagai bukti portofolio.`}
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
              <button className="secondary-button" type="button" onClick={() => goToPage(hasSkippedCareerFitQuiz ? 'matches' : 'quiz')}>
                {hasSkippedCareerFitQuiz ? 'Kembali ke Rekomendasi' : 'Kembali ke Kuis Singkat'}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  startNewAnalysisSession();
                  goToPage('cv', { force: true });
                }}
              >
                Ulangi dari Unggah CV
              </button>
            </div>
          </article>
        </section>

        <section className="insight-section" id="project-fit">
          <div className="insight-copy">
            <span className="section-kicker">Untuk mahasiswa dan lulusan baru</span>
            <h2>Biar langkahmu lebih jelas</h2>
            <p>
              SkillMap membantu kamu melihat kelebihan dari CV, bagian yang masih perlu dilatih,
              dan urutan belajar yang lebih mudah diikuti sebelum melamar kerja.
            </p>
          </div>

          <div className="feature-panel">
            <div className="feature-module-list">
              <span>Yang bisa kamu lakukan</span>
              {[
                'Baca kemampuan dari CV',
                'Lihat pekerjaan yang cocok',
                'Tahu kemampuan yang perlu dilatih',
                'Dapat rencana belajar',
                'Simpan hasil di profil'
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
        <div className="footer-brand">
          <strong>SkillMap</strong>
          <p>2026 SkillMap. Bantu baca CV, cari arah kerja, dan susun rencana belajar.</p>
        </div>

        <div className="footer-credits" aria-label="Dibuat oleh tim SkillMap">
          <span className="footer-credit-label">Dibuat oleh</span>
          <div className="footer-tech-grid">
            <section className="footer-tech">
              <h3>Full-stack</h3>
              <ul>
                <li>Aulia Dwi Fathonah <span>Universitas Sultan Ageng Tirtayasa</span></li>
                <li>Naufal Arhab Muhammad <span>Universitas Sultan Ageng Tirtayasa</span></li>
              </ul>
            </section>
            <section className="footer-tech">
              <h3>Data Science</h3>
              <ul>
                <li>Anna Ramadhan <span>Universitas Jenderal Soedirman</span></li>
                <li>Wakhida Fajar Ardhiani <span>Universitas Sultan Ageng Tirtayasa</span></li>
              </ul>
            </section>
            <section className="footer-tech">
              <h3>AI Engineer</h3>
              <ul>
                <li>Hanif Fadhilah <span>Universitas Gunadarma</span></li>
                <li>Ade Bintang Septian <span>Universitas Gunadarma</span></li>
              </ul>
            </section>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
