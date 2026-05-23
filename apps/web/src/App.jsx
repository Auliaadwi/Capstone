import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createRecommendation,
  fetchDashboard,
  fetchRoles,
  uploadCv
} from './api';

const defaultRole = {
  id: 'fullstack-web-developer',
  name: 'Pengembang Web Full-Stack Junior',
  domain: 'technology',
  requiredSkills: ['JavaScript', 'React', 'Express', 'REST API', 'PostgreSQL', 'Deployment', 'Testing'],
  businessGoal: 'Siap melamar posisi full-stack junior dengan portofolio end-to-end.',
  marketSignals: ['Integrasi React dan API', 'Backend RESTful', 'Penyimpanan database', 'Deployment publik']
};

const projectManagerRole = {
  id: 'project-manager-digital',
  name: 'Junior Project Manager Digital',
  domain: 'business',
  requiredSkills: ['Time Management', 'Leadership', 'Communication', 'Project Planning', 'Problem Solving', 'Risk Management'],
  businessGoal: 'Siap masuk role coordinator, management trainee, atau junior project manager.',
  marketSignals: ['Manajemen waktu', 'Koordinasi tim', 'Timeline proyek', 'Risk tracking']
};

const fallbackRoles = [defaultRole, projectManagerRole];

const initialAnalysis = {
  extractedSkills: ['Manajemen Waktu', 'Koordinasi Tim', 'Pemecahan Masalah'],
  skillGap: ['Project Planning', 'Risk Management', 'Leadership'],
  jobMatches: [
    {
      id: 'project-manager-digital',
      name: 'Junior Project Manager Digital',
      matchScore: 80,
      matchedSkills: ['Time Management', 'Communication', 'Problem Solving'],
      requiredSkills: projectManagerRole.requiredSkills,
      businessGoal: projectManagerRole.businessGoal,
      marketSignals: projectManagerRole.marketSignals
    },
    {
      id: 'fullstack-web-developer',
      name: defaultRole.name,
      matchScore: 62,
      matchedSkills: ['JavaScript', 'React'],
      requiredSkills: defaultRole.requiredSkills,
      businessGoal: defaultRole.businessGoal,
      marketSignals: defaultRole.marketSignals
    }
  ],
  recommendation: [
    'Fokus pada bukti pengalaman mengatur waktu, koordinasi tim, dan penyelesaian proyek.',
    'Buat studi kasus singkat dari proyek pribadi, organisasi, atau magang.',
    'Siapkan cerita interview dengan format masalah, aksi, hasil, dan pelajaran.',
    'Lengkapi gap project planning sebelum melamar role coordinator atau junior project manager.'
  ],
  roadmap: [
    {
      id: 'step-1',
      title: 'Validasi manajemen waktu',
      duration: '1-2 minggu',
      action: 'Buat jadwal mingguan, deadline tracker, dan catatan progres untuk satu proyek.'
    },
    {
      id: 'step-2',
      title: 'Bangun bukti project planning',
      duration: '1-2 minggu',
      action: 'Susun timeline proyek sederhana lengkap dengan milestone, owner, status, dan risiko.'
    },
    {
      id: 'step-3',
      title: 'Latih komunikasi stakeholder',
      duration: '2-3 minggu',
      action: 'Buat template update progres mingguan dan notulen meeting yang rapi.'
    }
  ],
  confidence: 0.82,
  readinessScore: 80,
  readinessLabel: 'hampir siap',
  targetRole: projectManagerRole.name,
  targetRoleId: projectManagerRole.id,
  suggestedRoleId: projectManagerRole.id,
  marketSignals: projectManagerRole.marketSignals,
  businessGoal: projectManagerRole.businessGoal,
  careerRecommendation: {
    title: projectManagerRole.name,
    summary: 'Kamu terlihat dekat dengan jalur Junior Project Manager Digital karena punya sinyal manajemen waktu, komunikasi, dan problem solving.',
    nextSteps: [
      'Siapkan CV yang menonjolkan pengalaman koordinasi dan deadline.',
      'Buat studi kasus dari proyek pribadi, organisasi, atau magang.',
      'Latih cerita interview dengan format masalah, aksi, hasil, dan pelajaran.'
    ]
  },
  courseRecommendations: [
    {
      skill: 'Project Planning',
      platform: 'Coursera',
      title: 'Google Project Management: Foundations',
      url: 'https://www.coursera.org/learn/project-management-foundations',
      reason: 'Menutup gap perencanaan sebelum mengambil rekomendasi karier utama.'
    },
    {
      skill: 'Time Management',
      platform: 'Coursera',
      title: 'Manajemen Waktu dan Prioritas Kerja',
      url: 'https://www.coursera.org/search?query=time%20management',
      reason: 'Membantu membangun kebiasaan deadline tracking.'
    },
    {
      skill: 'Communication',
      platform: 'TOEFL Preparation',
      title: 'TOEFL Speaking and Professional Communication',
      url: 'https://www.ets.org/toefl/test-takers/ibt/prepare.html',
      reason: 'Membantu memperkuat bahasa Inggris dan komunikasi profesional.'
    }
  ]
};

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
    title: 'Mini quiz YES/NO',
    description:
      'Jawaban singkat menentukan apakah user diarahkan ke rekomendasi karier atau pilihan e-course.',
    points: ['Cabang karier', 'Cabang e-course']
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
  { value: '5 tahap', label: 'CV sampai dashboard' },
  { value: 'AI + quiz', label: 'rekomendasi personal' }
];

const biodataFields = [
  {
    id: 'expectedPosition',
    label: 'Role atau posisi yang ingin dituju',
    placeholder: 'Contoh: Frontend Developer, Data Analyst, Project Coordinator...',
    wide: true
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

const yesNoLabels = {
  yes: 'YES',
  no: 'NO'
};

const flowPages = [
  { id: 'cv', number: '01', label: 'Upload CV', title: 'Upload CV PDF', description: 'Unggah CV terlebih dahulu sebagai sumber utama analisis.' },
  { id: 'biodata', number: '02', label: 'Profil Singkat', title: 'Profil singkat tambahan', description: 'Tambahkan informasi penting yang belum tertulis di CV.' },
  { id: 'matches', number: '03', label: 'Job Match', title: 'Rekomendasi pekerjaan', description: 'Lihat pekerjaan yang paling cocok berdasarkan persentase kecocokan.' },
  { id: 'quiz', number: '04', label: 'Mini Quiz', title: 'Mini quiz YES/NO', description: 'Jawab satu pertanyaan untuk menentukan cabang karier atau e-course.' },
  { id: 'dashboard', number: '05', label: 'Dashboard', title: 'Dashboard personal', description: 'Lihat gap, skor kesiapan, dan langkah berikutnya.' }
];

function getPageFromHash() {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const pageId = window.location.hash.replace(/^#\/?/, '') || 'home';
  if (pageId === 'home') {
    return 'home';
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

  if (pageId === 'dashboard' && !guardState.quizResult) {
    return 'Jawab mini quiz dulu sebelum masuk dashboard akhir.';
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

function getMiniQuizQuestion(roleName = '') {
  if (/manager|project|coordinator|management/i.test(roleName)) {
    return 'Apakah kamu pandai mengatur waktu dan membagi prioritas?';
  }

  if (/data/i.test(roleName)) {
    return 'Apakah kamu nyaman membaca data sebelum mengambil keputusan?';
  }

  if (/ai|machine|nlp/i.test(roleName)) {
    return 'Apakah kamu siap belajar eksperimen model secara konsisten?';
  }

  return 'Apakah kamu siap menyelesaikan task teknis sampai menjadi portofolio?';
}

function getFallbackCareerRecommendation(role, score) {
  return {
    title: role?.name || 'Rekomendasi karier',
    summary: `Kamu punya kecocokan sekitar ${score || 0}% untuk jalur ${role?.name || 'karier pilihan'}.`,
    nextSteps: [
      'Rapikan CV dengan bukti proyek, organisasi, magang, atau portofolio.',
      'Latih cerita interview menggunakan format masalah, aksi, hasil, dan pelajaran.',
      'Mulai lamar role junior, trainee, internship, atau assistant yang paling dekat.'
    ]
  };
}

function getFallbackCourseOptions(gaps = []) {
  const fallbackCourseMap = {
    JavaScript: ['Dicoding', 'Belajar Dasar Pemrograman JavaScript', 'https://www.dicoding.com/academies/256-belajar-dasar-pemrograman-javascript'],
    React: ['Dicoding', 'Belajar Membuat Aplikasi Web dengan React', 'https://www.dicoding.com/academies/403-belajar-membuat-aplikasi-web-dengan-react'],
    Express: ['Dicoding', 'Belajar Membuat Aplikasi Back-End untuk Pemula', 'https://www.dicoding.com/academies/261-belajar-back-end-pemula-dengan-javascript'],
    'REST API': ['Postman Academy', 'API Fundamentals Student Expert', 'https://academy.postman.com/'],
    PostgreSQL: ['freeCodeCamp', 'Relational Database Certification', 'https://www.freecodecamp.org/learn/relational-database'],
    Deployment: ['AWS Skill Builder', 'AWS Cloud Practitioner Essentials', 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials'],
    Testing: ['Dicoding', 'Belajar Dasar Quality Assurance', 'https://www.dicoding.com/academies/list'],
    Python: ['Dicoding', 'Memulai Pemrograman dengan Python', 'https://www.dicoding.com/academies/list'],
    TensorFlow: ['DeepLearning.AI', 'TensorFlow Developer Professional Certificate', 'https://www.deeplearning.ai/courses/tensorflow-developer-professional-certificate/'],
    NLP: ['Coursera', 'Natural Language Processing Specialization', 'https://www.coursera.org/specializations/natural-language-processing'],
    'Data Wrangling': ['DQLab', 'Data Analyst Career Track', 'https://dqlab.id/'],
    EDA: ['DQLab', 'Exploratory Data Analysis with Python', 'https://dqlab.id/'],
    Communication: ['TOEFL Preparation', 'TOEFL Speaking and Professional Communication', 'https://www.ets.org/toefl/test-takers/ibt/prepare.html'],
    'Time Management': ['Coursera', 'Manajemen Waktu dan Prioritas Kerja', 'https://www.coursera.org/search?query=time%20management'],
    Leadership: ['LinkedIn Learning', 'Dasar Kepemimpinan dan Koordinasi Tim', 'https://www.linkedin.com/learning/topics/leadership-and-management'],
    'Project Planning': ['Coursera', 'Google Project Management: Foundations', 'https://www.coursera.org/learn/project-management-foundations'],
    'Risk Management': ['PMI', 'Project Risk Management Basics', 'https://www.pmi.org/learning/training-development']
  };
  const focus = gaps.length ? gaps.slice(0, 3) : ['Time Management', 'Communication', 'Project Planning'];
  return focus.map((gap) => ({
    skill: gap,
    platform: fallbackCourseMap[gap]?.[0] || 'Dicoding / Coursera',
    title: fallbackCourseMap[gap]?.[1] || `Dasar ${gap} untuk Karier Entry-Level`,
    url: fallbackCourseMap[gap]?.[2] || 'https://www.coursera.org/search?query=career%20skills',
    reason: `Dipilih karena ${gap} masih menjadi gap utama dari hasil scan.`
  }));
}

function getCourseFallbackUrl(course = {}) {
  const urlBySkill = {
    JavaScript: 'https://www.dicoding.com/academies/256-belajar-dasar-pemrograman-javascript',
    React: 'https://www.dicoding.com/academies/403-belajar-membuat-aplikasi-web-dengan-react',
    Express: 'https://www.dicoding.com/academies/261-belajar-back-end-pemula-dengan-javascript',
    'REST API': 'https://academy.postman.com/',
    PostgreSQL: 'https://www.freecodecamp.org/learn/relational-database',
    Deployment: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials',
    Testing: 'https://www.dicoding.com/academies/list',
    Python: 'https://www.dicoding.com/academies/list',
    TensorFlow: 'https://www.deeplearning.ai/courses/tensorflow-developer-professional-certificate/',
    NLP: 'https://www.coursera.org/specializations/natural-language-processing',
    'Data Wrangling': 'https://dqlab.id/',
    EDA: 'https://dqlab.id/',
    Communication: 'https://www.ets.org/toefl/test-takers/ibt/prepare.html',
    'Time Management': 'https://www.coursera.org/search?query=time%20management',
    Leadership: 'https://www.linkedin.com/learning/topics/leadership-and-management',
    'Project Planning': 'https://www.coursera.org/learn/project-management-foundations',
    'Risk Management': 'https://www.pmi.org/learning/training-development'
  };

  return course.url || urlBySkill[course.skill] || 'https://www.coursera.org/search?query=career%20skills';
}

function withCourseUrl(course = {}) {
  return {
    ...course,
    url: getCourseFallbackUrl(course)
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

function CourseInlineLink({ course }) {
  const linkedCourse = withCourseUrl(course);
  const title = linkedCourse.title || 'course utama';

  if (!linkedCourse.url) {
    return <strong>{title}</strong>;
  }

  return (
    <a
      className="course-inline-link"
      href={linkedCourse.url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => openCourse(event, linkedCourse.url)}
    >
      {title}
    </a>
  );
}

function CourseItem({ course }) {
  const linkedCourse = withCourseUrl(course);

  return (
    <div className="course-item">
      <span>{linkedCourse.platform}</span>
      <strong>{linkedCourse.title}</strong>
      <p>{linkedCourse.reason}</p>
      <a
        className="course-link-button"
        href={linkedCourse.url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => openCourse(event, linkedCourse.url)}
      >
        Buka course
      </a>
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

  return null;
}

function App() {
  const [roles, setRoles] = useState(fallbackRoles);
  const [targetRole, setTargetRole] = useState(projectManagerRole.id);
  const [dashboard, setDashboard] = useState(null);
  const [biodata, setBiodata] = useState(initialBiodata);
  const [isBiodataSaved, setIsBiodataSaved] = useState(false);
  const [hasScannedCv, setHasScannedCv] = useState(false);
  const [miniQuizAnswer, setMiniQuizAnswer] = useState(null);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [quizResult, setQuizResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [extractedCvText, setExtractedCvText] = useState('');
  const [selectedCvFile, setSelectedCvFile] = useState(null);
  const [showBiodataErrors, setShowBiodataErrors] = useState(false);
  const [showCvErrors, setShowCvErrors] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [statusMessage, setStatusMessage] = useState('');

  const activeRole = useMemo(
    () => roles.find((role) => role.id === targetRole) || defaultRole,
    [roles, targetRole]
  );

  const activeRoadmap = recommendation?.roadmap || analysis.roadmap || [];
  const currentInsight = recommendation || analysis;
  const answeredCount = miniQuizAnswer ? 1 : 0;
  const quizProgress = miniQuizAnswer ? 100 : 0;
  const topStrengths = ((currentInsight.extractedSkills || analysis.extractedSkills)?.length ? (currentInsight.extractedSkills || analysis.extractedSkills) : ['Belajar mandiri']).slice(0, 3);
  const topGaps = ((currentInsight.skillGap || analysis.skillGap)?.length ? (currentInsight.skillGap || analysis.skillGap) : ['Latihan portofolio']).slice(0, 3);
  const expectedPositionText = getMeaningfulText(biodata.expectedPosition);
  const skillsText = getMeaningfulText(biodata.skills);
  const profileSummaryText = getMeaningfulText(biodata.profileSummary);
  const experienceText = getMeaningfulText(biodata.experience);
  const requiredBiodataFields = useMemo(
    () => biodataFields.filter((field) => field.required !== false),
    []
  );
  const biodataFilledCount = useMemo(
    () => requiredBiodataFields.filter((field) => hasMeaningfulText(biodata[field.id])).length,
    [biodata, requiredBiodataFields]
  );
  const biodataProgress = Math.round((biodataFilledCount / requiredBiodataFields.length) * 100);
  const jobMatches = recommendation?.jobMatches || analysis.jobMatches || [];
  const bestMatch = jobMatches[0] || {
    id: analysis.suggestedRoleId || targetRole,
    name: analysis.targetRole || activeRole.name,
    matchScore: analysis.readinessScore || 0,
    matchedSkills: analysis.extractedSkills || []
  };
  const finalReadinessScore = quizResult?.score ?? currentInsight.readinessScore ?? analysis.readinessScore ?? bestMatch.matchScore ?? 0;
  const suggestedRole = roles.find((role) => role.id === (analysis.suggestedRoleId || bestMatch.id || targetRole)) || activeRole;
  const miniQuizQuestion = getMiniQuizQuestion(bestMatch.name || suggestedRole.name);
  const careerRecommendation = currentInsight.careerRecommendation || getFallbackCareerRecommendation(suggestedRole, bestMatch.matchScore);
  const courseRecommendations = currentInsight.courseRecommendations?.length
    ? currentInsight.courseRecommendations.map(withCourseUrl)
    : getFallbackCourseOptions(topGaps).map(withCourseUrl);
  const dashboardProfileRows = useMemo(
    () => [
      { label: 'Target role', value: expectedPositionText },
      { label: 'Skill tambahan', value: skillsText },
      { label: 'Catatan', value: experienceText }
    ].filter((row) => row.value),
    [expectedPositionText, skillsText, experienceText]
  );
  const dashboardSignals = (
    currentInsight.marketSignals?.length
      ? currentInsight.marketSignals
      : activeRole.marketSignals?.length
        ? activeRole.marketSignals
        : [...topGaps, ...topStrengths]
  ).slice(0, 5);
  const dashboardPrimaryCourse = courseRecommendations[0];
  const dashboardTrackLabel = miniQuizAnswer === 'yes'
    ? 'Jalur karier'
    : miniQuizAnswer === 'no'
      ? 'Jalur belajar'
      : 'Insight awal';
  const dashboardDecisionTitle = miniQuizAnswer === 'yes'
    ? (careerRecommendation.title || bestMatch.name)
    : miniQuizAnswer === 'no'
      ? `Fokus ke ${dashboardPrimaryCourse?.skill || topGaps[0] || 'skill prioritas'} dulu`
      : (bestMatch.name || activeRole.name);
  const dashboardDecisionCopy = miniQuizAnswer === 'yes'
    ? (careerRecommendation.summary || activeRole.businessGoal || analysis.businessGoal)
    : miniQuizAnswer === 'no'
      ? `Tutup gap utama lewat latihan kecil dan course yang relevan. Prioritas pertama: ${dashboardPrimaryCourse?.skill || topGaps[0] || 'skill prioritas'}.`
      : (activeRole.businessGoal || analysis.businessGoal);
  const dashboardDecisionSupportCopy = miniQuizAnswer === 'yes'
    ? 'Basisnya sudah cukup. Fokus berikutnya ada di satu gap paling penting lalu ubah jadi bukti kerja.'
    : miniQuizAnswer === 'no'
      ? 'Tahan apply dulu. Rapikan fondasi skill utama lalu evaluasi ulang setelah latihan.'
      : 'Belum ada keputusan akhir sampai mini quiz dijawab.';
  const dashboardActivityMetrics = dashboard?.activity
    ? [
        { label: 'Analisis CV', value: dashboard.activity.cvAnalyses?.length || 0 },
        { label: 'Hasil quiz', value: dashboard.activity.quizAttempts?.length || 0 }
      ]
    : [];
  const activePage = flowPages.find((page) => page.id === currentPage) || flowPages[0];
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [rolesResponse, dashboardResponse] = await Promise.all([
          fetchRoles(),
          fetchDashboard()
        ]);
        setRoles(rolesResponse.data.roles?.length ? rolesResponse.data.roles : fallbackRoles);
        setDashboard(dashboardResponse.data);
      } catch (error) {
        clearStatusMessage();
      }
    };

    loadInitialData();
  }, []);

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
    setMiniQuizAnswer(null);
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
      const inferredTargetRole = inferTargetRoleIdFromProfile(biodata, roles, targetRole);
      const inferredRole = roles.find((role) => role.id === inferredTargetRole) || activeRole;
      setTargetRole(inferredTargetRole);
      const response = await uploadCv(file, inferredRole.domain || 'technology', inferredTargetRole, profileText);
      setAnalysis(response.data);
      setExtractedCvText(response.data.extractedCvText || '');
      setRecommendation(null);
      setQuizResult(null);
      setMiniQuizAnswer(null);
      setHasScannedCv(true);
      if (response.data.suggestedRoleId) {
        setTargetRole(response.data.suggestedRoleId);
      }
      clearStatusMessage();
      goToPage('matches', { force: true });
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
      setMiniQuizAnswer(null);
      setExtractedCvText('');
      setShowCvErrors(false);
      clearStatusMessage();
      goToPage('biodata');
      event.target.value = '';
    }
  };

  const handleQuizSubmit = async () => {
    if (!miniQuizAnswer) {
      clearStatusMessage();
      return;
    }

    setIsSubmittingQuiz(true);
    clearStatusMessage();

    try {
      const baseScore = bestMatch.matchScore ?? analysis.readinessScore ?? 0;
      const quizScore = miniQuizAnswer === 'yes'
        ? Math.min(96, Math.max(82, baseScore + 6))
        : Math.max(38, Math.min(68, baseScore - 16));
      const quizData = {
        score: quizScore,
        track: miniQuizAnswer === 'yes' ? 'career-ready' : 'course-first',
        recommendation: miniQuizAnswer === 'yes'
          ? `Lanjutkan ke rekomendasi karier ${bestMatch.name}.`
          : 'Mulai dari pilihan e-course untuk menutup gap utama dulu.'
      };

      setQuizResult(quizData);

      const recommendationResponse = await createRecommendation({
        targetRole: bestMatch.id || analysis.suggestedRoleId || targetRole,
        extractedSkills: analysis.extractedSkills,
        quizScore
      });
      setRecommendation({
        ...recommendationResponse.data,
        extractedSkills: analysis.extractedSkills,
        jobMatches,
        suggestedRoleId: bestMatch.id || analysis.suggestedRoleId || targetRole
      });
      clearStatusMessage();
      goToPage('dashboard', { force: true });
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
            <span>Langkah {activePage.number} / 05</span>
            <strong>{activePage.label}</strong>
          </div>
        )}

        <button className="nav-cta" type="button" onClick={() => goToPage(currentPage === 'home' ? 'cv' : 'home', { force: true })}>
          {currentPage === 'home' ? 'Mulai Scan' : 'Beranda'}
        </button>
      </header>

      <main>
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
              pekerjaan diurutkan berdasarkan kecocokan, lalu mini quiz menentukan cabang akhir.
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
            <span className="page-counter">Langkah {activePage.number} dari 05</span>
            <h2>{activePage.title}</h2>
            <p>{activePage.description}</p>
          </div>

          {statusMessage && (
            <p className="status-line workspace-status">{statusMessage}</p>
          )}

          <div className="workspace-grid">
            <article className="workspace-panel biodata-panel">
              <div className="panel-label">02 / Profil Singkat</div>
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
              <div className="panel-label">01 / Upload CV</div>
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
                  <span>Skill terdeteksi</span>
                  <div className="chip-row">
                    {analysis.extractedSkills?.map((skill) => (
                      <span className="chip" key={skill}>{skill}</span>
                    ))}
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
              <div className="panel-label">03 / Rekomendasi Pekerjaan</div>
              <h3>Persentase kecocokan dari AI</h3>
              <p className="panel-helper">
                {hasScannedCv
                  ? 'Hasil ini berasal dari CV dan profil singkat tambahan terbaru yang kamu kirim.'
                  : 'Ini masih preview data contoh. Jalankan scan CV untuk hasil personal.'}
              </p>

              <div className="top-match-card">
                <span>Rekomendasi teratas</span>
                <strong>{bestMatch.name}</strong>
                <p>{bestMatch.matchScore}% dari 100% kecocokan</p>
              </div>

              <div className="match-list">
                {jobMatches.slice(0, 4).map((match) => (
                  <div className="match-row" key={match.id || match.name}>
                    <div>
                      <strong>{match.name}</strong>
                      <span>{match.matchedSkills?.length || 0} skill cocok</span>
                    </div>
                    <div className="match-score">
                      <span>{match.matchScore}%</span>
                      <div className="match-meter" aria-label={`Kecocokan ${match.matchScore}%`}>
                        <span style={{ width: `${match.matchScore}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('biodata', { force: true })}>
                  Kembali ke Profil Singkat
                </button>
                <button className="primary-button" type="button" onClick={() => goToPage('quiz')}>
                  Lanjut Mini Quiz
                </button>
              </div>
            </article>

            <article className="workspace-panel quiz-panel">
              <div className="panel-label">04 / Mini Quiz</div>
              <h3>Jawab YES atau NO</h3>
              <p className="panel-copy">{answeredCount} dari 1 pertanyaan terjawab</p>
              <div className="progress-track" aria-label={`Progres kuis ${quizProgress}%`}>
                <span style={{ width: `${quizProgress}%` }} />
              </div>
              <p className="panel-helper">
                Cabang flow mengikuti jawabanmu: YES menampilkan rekomendasi karier, NO menampilkan pilihan belajar e-course.
              </p>

              <div className="mini-quiz-card">
                <span>Role yang diuji: {bestMatch.name}</span>
                <p>{miniQuizQuestion}</p>
                <div className="yes-no-grid">
                  {Object.entries(yesNoLabels).map(([value, label]) => (
                    <button
                      className={`option-button ${miniQuizAnswer === value ? 'active' : ''}`}
                      key={value}
                      type="button"
                      onClick={() => setMiniQuizAnswer(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {miniQuizAnswer === 'yes' && (
                <div className="branch-result career">
                  <span>Cabang YES: rekomendasi karier</span>
                  <strong>{careerRecommendation.title}</strong>
                  <p>{careerRecommendation.summary}</p>
                  <ul>
                    {careerRecommendation.nextSteps?.slice(0, 3).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {miniQuizAnswer === 'no' && (
                <div className="branch-result course">
                  <span>Cabang NO: mulai dari e-course</span>
                  <strong>Pilihan belajar yang disarankan</strong>
                  {courseRecommendations[0]?.url && (
                    <a
                      className="course-direct-link"
                      href={courseRecommendations[0].url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => openCourse(event, courseRecommendations[0].url)}
                    >
                      Buka course utama: {courseRecommendations[0].title}
                    </a>
                  )}
                  <div className="course-list">
                    {courseRecommendations.slice(0, 3).map((course) => (
                      <CourseItem course={course} key={`${course.skill}-${course.title}`} />
                    ))}
                  </div>
                </div>
              )}

              <div className="page-actions step-actions">
                <button className="secondary-button" type="button" onClick={() => goToPage('matches', { force: true })}>
                  Kembali ke Job Match
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={isSubmittingQuiz || !miniQuizAnswer}
                >
                  {isSubmittingQuiz ? 'Menghitung...' : 'Lihat Dashboard'}
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

          </div>
        </section>

        <section className="dashboard-section" id="dashboard">
          {statusMessage && (
            <p className="status-line workspace-status">{statusMessage}</p>
          )}

          <article className="workspace-panel roadmap-panel-card dashboard-shell">
            <div className="dashboard-hero-band">
              <div className="dashboard-headline">
                <div className="panel-label">05 / Dasbor Personal</div>
                <h3>Arah kariermu saat ini</h3>
                <strong className="dashboard-role-title">{dashboardDecisionTitle}</strong>
                <p className="dashboard-summary-copy">{dashboardDecisionCopy}</p>
                <div className="dashboard-tag-row">
                  <span>{expectedPositionText || 'Target role belum diisi'}</span>
                  <span>{dashboardTrackLabel}</span>
                </div>
              </div>

              <div className="dashboard-score-pane">
                <span>Skor kesiapan</span>
                <strong>{finalReadinessScore}%</strong>
                <p>{currentInsight.readinessLabel || quizResult?.track || 'readiness'}</p>

                <div className="dashboard-metric-inline">
                  <div>
                    <span>Top match</span>
                    <strong>{bestMatch.matchScore}%</strong>
                    <small>{bestMatch.name}</small>
                  </div>
                  <div>
                    <span>Gap utama</span>
                    <strong>{topGaps[0] || '-'}</strong>
                    <small>{topGaps.length} fokus</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-content-grid">
              <section className="dashboard-section-block">
                <div className="dashboard-block-heading">
                  <span>Profil saat ini</span>
                  <strong>{expectedPositionText || bestMatch.name}</strong>
                </div>
                <p className="dashboard-block-copy">
                  {profileSummaryText || 'Isi profil singkat dengan konteks yang relevan.'}
                </p>

                {dashboardProfileRows.length > 0 && (
                  <div className="profile-row-list">
                    {dashboardProfileRows.map((row) => (
                      <div className="profile-row" key={row.label}>
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section-block dashboard-roadmap-card">
                <div className="dashboard-block-heading">
                  <span>Roadmap prioritas</span>
                  <strong>{activeRoadmap.length} langkah berikutnya</strong>
                </div>
                <div className="roadmap-list dashboard-roadmap-list">
                  {activeRoadmap.map((step, index) => (
                    <div className="roadmap-step" key={step.id || step.action}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{step.title || `Langkah ${index + 1}`}</strong>
                        {step.duration && <small>{step.duration}</small>}
                        <p>{step.action || step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="dashboard-insight-grid">
              <section className="dashboard-section-block">
                <div className="dashboard-skill-columns">
                  <div className="dashboard-skill-panel">
                    <span>Yang sudah kuat</span>
                    <div className="chip-row">
                      {topStrengths.map((skill) => (
                        <span className="chip" key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-skill-panel warm">
                    <span>Yang perlu dikejar</span>
                    <div className="chip-row">
                      {topGaps.map((gap) => (
                        <span className="chip ghost" key={gap}>{gap}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="dashboard-section-block">
                <div className="dashboard-block-heading">
                  <span>Keputusan sistem</span>
                  <strong>
                    {miniQuizAnswer === 'yes'
                      ? 'Lanjut ke jalur karier'
                      : miniQuizAnswer === 'no'
                        ? 'Belajar dulu sebelum apply'
                        : 'Belum ada keputusan akhir'}
                  </strong>
                </div>
                <p className="dashboard-block-copy">{dashboardDecisionSupportCopy}</p>

                <div className="dashboard-next-step-callout">
                  <span>Langkah pertama</span>
                  <p>
                    {miniQuizAnswer === 'no'
                      ? (
                        <>
                          Mulai dari e-course <CourseInlineLink course={dashboardPrimaryCourse} />, lalu ulangi evaluasi setelah latihan.
                        </>
                      )
                      : `Ambil ${topGaps[0] || 'roadmap paling atas'} sebagai fokus awal, buat latihan kecil, lalu simpan hasilnya sebagai bukti portofolio.`}
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

              {dashboardActivityMetrics.length > 0 && (
                <section className="dashboard-section-block dashboard-activity-block">
                  <div className="dashboard-block-heading">
                    <span>Aktivitas tersimpan</span>
                    <strong>Aktivitas penggunaan</strong>
                  </div>
                  <div className="dashboard-activity-grid">
                    {dashboardActivityMetrics.map((item) => (
                      <div className="dashboard-activity-item" key={item.label}>
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
