import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createRecommendation,
  fetchDashboard,
  fetchProjectRequirements,
  fetchRoles,
  saveLead,
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
    'Buat studi kasus singkat dari proyek capstone atau organisasi.',
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
      'Buat studi kasus dari proyek capstone, organisasi, atau magang.',
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

const sampleCvText =
  'Lulusan baru yang pernah menjadi koordinator proyek capstone, mengatur timeline, membagi prioritas tim, membuat notulen, menyelesaikan masalah deadline, serta belajar JavaScript dan React.';

const journeyCards = [
  {
    icon: 'scan',
    title: 'Biodata ala portal kerja',
    description:
      'Pengguna mengisi profil dasar seperti pendidikan, domisili, posisi yang diminati, dan pengalaman singkat.',
    points: ['Data pelamar terstruktur', 'Konteks sebelum scan CV']
  },
  {
    icon: 'brain',
    title: 'Scan CV berbasis AI',
    description:
      'CV dibaca untuk mendeteksi skill, pengalaman, dan sinyal yang cocok dengan kebutuhan pekerjaan.',
    points: ['Upload CV PDF', 'Ekstraksi teks otomatis']
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
    title: 'Dashboard insight capstone',
    description:
      'Dashboard menampilkan skor, kekuatan, gap, roadmap, dan ruang integrasi untuk AI/ML serta Data Science.',
    points: ['Insight hasil analisis', 'Siap untuk demo tim']
  }
];

const humanSteps = [
  {
    number: '1',
    title: 'Isi biodata',
    text: 'Mulai dari data dasar seperti nama, pendidikan, domisili, dan posisi yang diminati.'
  },
  {
    number: '2',
    title: 'Upload CV',
    text: 'AI membaca teks dari PDF CV dan menghitung persentase kecocokan pekerjaan.'
  },
  {
    number: '3',
    title: 'Mini quiz',
    text: 'Jawaban YES/NO menentukan apakah lanjut ke rekomendasi karier atau pilihan e-course.'
  }
];

const barRows = [
  [52, 70, 43, 86, 61, 74, 48, 92, 67, 58],
  [28, 45, 66, 37, 82, 54, 77, 34, 72, 49],
  [62, 31, 58, 79, 46, 68, 88, 40, 73, 55]
];

const biodataFields = [
  { id: 'fullName', label: 'Nama lengkap', placeholder: 'Contoh: Siti Aulia' },
  { id: 'location', label: 'Domisili', placeholder: 'Jakarta, Bandung, Surabaya...' },
  { id: 'education', label: 'Pendidikan terakhir', placeholder: 'S1 Informatika, D3 Akuntansi...' },
  { id: 'major', label: 'Jurusan / bidang', placeholder: 'Sistem Informasi, Manajemen...' },
  { id: 'expectedPosition', label: 'Posisi yang diminati', placeholder: 'Project Manager, Web Developer...' },
  { id: 'workMode', label: 'Preferensi kerja', placeholder: 'Remote, hybrid, onsite' },
  {
    id: 'experience',
    label: 'Pengalaman singkat',
    placeholder: 'Ceritakan proyek, organisasi, magang, atau pekerjaan yang pernah kamu lakukan.',
    wide: true,
    multiline: true
  }
];

const initialBiodata = {
  fullName: '',
  location: '',
  education: '',
  major: '',
  expectedPosition: '',
  workMode: '',
  experience: ''
};

const yesNoLabels = {
  yes: 'YES',
  no: 'NO'
};

const flowPages = [
  { id: 'biodata', number: '01', label: 'Biodata', title: 'Biodata pelamar', description: 'Isi data dasar seperti portal lowongan kerja sebelum CV dipindai AI.' },
  { id: 'cv', number: '02', label: 'Upload CV', title: 'Upload dan scan CV', description: 'Unggah CV PDF, lalu sistem menampilkan teks yang akan dibaca AI.' },
  { id: 'matches', number: '03', label: 'Job Match', title: 'Rekomendasi pekerjaan', description: 'Lihat pekerjaan yang paling cocok berdasarkan persentase kecocokan.' },
  { id: 'quiz', number: '04', label: 'Mini Quiz', title: 'Mini quiz YES/NO', description: 'Jawab satu pertanyaan untuk menentukan cabang karier atau e-course.' },
  { id: 'dashboard', number: '05', label: 'Dashboard', title: 'Dashboard personal', description: 'Lihat ringkasan akhir, gap, dan langkah berikutnya.' }
];

function getPageFromHash() {
  if (typeof window === 'undefined') {
    return 'biodata';
  }

  const pageId = window.location.hash.replace(/^#\/?/, '') || 'biodata';
  return flowPages.some((page) => page.id === pageId) ? pageId : 'biodata';
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

  if (pageIndex > 0 && !guardState.isBiodataComplete) {
    return `Lengkapi semua biodata dulu: ${formatMissingFields(guardState.missingBiodataFields)}.`;
  }

  if (pageIndex > 1 && !guardState.hasScannedCv) {
    return 'Upload CV PDF dan jalankan scan dulu sebelum lanjut ke job match.';
  }

  if (pageId === 'dashboard' && !guardState.quizResult) {
    return 'Jawab mini quiz dulu sebelum masuk dashboard akhir.';
  }

  return '';
}

function formatBiodataText(biodata) {
  return [
    biodata.fullName && `Nama: ${biodata.fullName}`,
    biodata.location && `Domisili: ${biodata.location}`,
    biodata.education && `Pendidikan: ${biodata.education}`,
    biodata.major && `Jurusan: ${biodata.major}`,
    biodata.expectedPosition && `Posisi diminati: ${biodata.expectedPosition}`,
    biodata.workMode && `Preferensi kerja: ${biodata.workMode}`,
    biodata.experience && `Pengalaman: ${biodata.experience}`
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

function DashboardVisual({ analysis }) {
  const score = analysis.readinessScore ?? Math.round((analysis.confidence || 0) * 100);
  const primarySkill = analysis.extractedSkills?.[0] || 'JavaScript';
  const primaryGap = analysis.skillGap?.[0] || 'Express';
  const supportingSkills = analysis.extractedSkills?.slice(0, 3) || ['JavaScript', 'React', 'API'];
  const priorityGaps = analysis.skillGap?.slice(0, 3) || ['Express', 'PostgreSQL', 'Deployment'];

  return (
    <div className="hero-visual" aria-label="Pratinjau dasbor analisis keterampilan">
      <div className="visual-frame">
        <div className="dashboard-screen">
          <div className="screen-shell">
            <aside className="visual-sidebar" aria-hidden="true">
              <span className="mini-logo">SM</span>
              <span className="sidebar-dot active" />
              <span className="sidebar-dot" />
              <span className="sidebar-dot" />
              <span className="sidebar-line" />
            </aside>

            <div className="visual-main">
              <div className="dashboard-topbar">
                <div>
                  <span>SkillMap Analytics</span>
                  <strong>{analysis.targetRole || defaultRole.name}</strong>
                </div>
                <span className="status-pill">Live Scan</span>
              </div>

              <div className="dashboard-grid">
                <div className="chart-panel large">
                  <div className="panel-heading">
                    <span>Perkembangan kesiapan</span>
                    <strong>+18%</strong>
                  </div>
                  <div className="line-chart">
                    <svg viewBox="0 0 320 170" preserveAspectRatio="none" aria-hidden="true">
                      <path className="chart-fill" d="M0 132 C42 112 58 82 96 92 C135 104 144 48 184 58 C222 68 239 98 276 58 C298 36 312 30 320 26 L320 170 L0 170 Z" />
                      <path className="chart-line main" d="M0 132 C42 112 58 82 96 92 C135 104 144 48 184 58 C222 68 239 98 276 58 C298 36 312 30 320 26" />
                      <path className="chart-line soft" d="M0 108 C40 118 62 128 98 116 C142 102 160 118 196 108 C236 98 256 78 320 92" />
                    </svg>
                    <span className="chart-marker one" />
                    <span className="chart-marker two" />
                  </div>
                </div>

                <div className="readiness-meter" style={{ '--meter': `${score * 3.6}deg` }}>
                  <div className="meter-ring">
                    <strong>{score}%</strong>
                    <span>Siap</span>
                  </div>
                  <p>CV sudah kuat untuk fondasi, tinggal tutup gap prioritas.</p>
                </div>

                <div className="skill-stack">
                  <span className="panel-label-small">Skill terdeteksi</span>
                  <div>
                    {supportingSkills.map((skill) => (
                      <span className="mini-chip" key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="bar-panel compact">
                  {barRows[0].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>

                <div className="focus-card">
                  <span className="panel-label-small">Prioritas berikutnya</span>
                  <strong>{primaryGap}</strong>
                  <div>
                    {priorityGaps.map((gap) => (
                      <span key={gap}>{gap}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="floating-badge skill-badge">
        <span className="badge-icon">
          <Icon name="check" size={15} />
        </span>
        <strong>Keahlian {primarySkill}</strong>
        <span>{score}% Siap</span>
      </div>

      <div className="floating-badge gap-badge">
        <span className="badge-icon muted">
          <Icon name="trend" size={16} />
        </span>
        <strong>Gap Prioritas</strong>
        <span>{primaryGap}</span>
      </div>
    </div>
  );
}

function App() {
  const [roles, setRoles] = useState(fallbackRoles);
  const [targetRole, setTargetRole] = useState(projectManagerRole.id);
  const [dashboard, setDashboard] = useState(null);
  const [projectRequirements, setProjectRequirements] = useState(null);
  const [biodata, setBiodata] = useState(initialBiodata);
  const [isBiodataSaved, setIsBiodataSaved] = useState(false);
  const [hasScannedCv, setHasScannedCv] = useState(false);
  const [miniQuizAnswer, setMiniQuizAnswer] = useState(null);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [quizResult, setQuizResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [cvText, setCvText] = useState('');
  const [extractedCvText, setExtractedCvText] = useState('');
  const [selectedCvFile, setSelectedCvFile] = useState(null);
  const [showBiodataErrors, setShowBiodataErrors] = useState(false);
  const [showCvErrors, setShowCvErrors] = useState(false);
  const [email, setEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [statusMessage, setStatusMessage] = useState('Isi biodata terlebih dahulu, lalu upload CV untuk memulai scan AI.');

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
  const biodataFilledCount = useMemo(
    () => Object.values(biodata).filter((value) => String(value).trim()).length,
    [biodata]
  );
  const biodataProgress = Math.round((biodataFilledCount / Object.keys(initialBiodata).length) * 100);
  const jobMatches = recommendation?.jobMatches || analysis.jobMatches || [];
  const bestMatch = jobMatches[0] || {
    id: analysis.suggestedRoleId || targetRole,
    name: analysis.targetRole || activeRole.name,
    matchScore: analysis.readinessScore || 0,
    matchedSkills: analysis.extractedSkills || []
  };
  const suggestedRole = roles.find((role) => role.id === (analysis.suggestedRoleId || bestMatch.id || targetRole)) || activeRole;
  const miniQuizQuestion = getMiniQuizQuestion(bestMatch.name || suggestedRole.name);
  const careerRecommendation = currentInsight.careerRecommendation || getFallbackCareerRecommendation(suggestedRole, bestMatch.matchScore);
  const courseRecommendations = currentInsight.courseRecommendations?.length
    ? currentInsight.courseRecommendations.map(withCourseUrl)
    : getFallbackCourseOptions(topGaps).map(withCourseUrl);
  const capstoneModules = dashboard?.featureModules || projectRequirements?.mvpFeatures || [];
  const researchQuestions = dashboard?.researchQuestions || [];
  const activePage = flowPages.find((page) => page.id === currentPage) || flowPages[0];
  const missingBiodataFields = useMemo(
    () => biodataFields.filter((field) => !String(biodata[field.id] || '').trim()),
    [biodata]
  );
  const missingBiodataIds = useMemo(
    () => new Set(missingBiodataFields.map((field) => field.id)),
    [missingBiodataFields]
  );
  const isBiodataComplete = missingBiodataFields.length === 0;
  const isCvSummaryFilled = Boolean(cvText.trim());
  const navigationGuard = {
    isBiodataComplete,
    hasScannedCv,
    quizResult,
    missingBiodataFields
  };
  const navigationGuardRef = useRef(navigationGuard);
  navigationGuardRef.current = navigationGuard;

  const getPageBlockMessage = (pageId) => getPageBlockMessageForState(pageId, navigationGuard);

  const goToPage = (pageId, options = {}) => {
    if (!options.force) {
      const blockedMessage = getPageBlockMessage(pageId);
      if (blockedMessage) {
        setStatusMessage(blockedMessage);
        if (!isBiodataComplete) {
          setShowBiodataErrors(true);
          setCurrentPage('biodata');
          window.history.pushState(null, '', '#/biodata');
        } else if (!hasScannedCv) {
          setShowCvErrors(true);
          setCurrentPage('cv');
          window.history.pushState(null, '', '#/cv');
        } else {
          setCurrentPage('quiz');
          window.history.pushState(null, '', '#/quiz');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentPage(pageId);
    if (window.location.hash !== `#/${pageId}`) {
      window.history.pushState(null, '', `#/${pageId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [rolesResponse, dashboardResponse, requirementsResponse] = await Promise.all([
          fetchRoles(),
          fetchDashboard(),
          fetchProjectRequirements()
        ]);
        setRoles(rolesResponse.data.roles?.length ? rolesResponse.data.roles : fallbackRoles);
        setDashboard(dashboardResponse.data);
        setProjectRequirements(requirementsResponse.data);
      } catch (error) {
        setStatusMessage(error.message || 'Gagal terhubung ke API SkillMap.');
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
        setStatusMessage(blockedMessage);
        if (!guardState.isBiodataComplete) {
          setShowBiodataErrors(true);
          setCurrentPage('biodata');
          window.history.replaceState(null, '', '#/biodata');
        } else if (!guardState.hasScannedCv) {
          setShowCvErrors(true);
          setCurrentPage('cv');
          window.history.replaceState(null, '', '#/cv');
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
  };

  const handleSaveBiodata = () => {
    if (!isBiodataComplete) {
      setShowBiodataErrors(true);
      setStatusMessage(`Semua biodata wajib diisi. Masih kosong: ${formatMissingFields(missingBiodataFields)}.`);
      goToPage('biodata', { force: true });
      return;
    }

    setShowBiodataErrors(false);
    setIsBiodataSaved(true);
    setStatusMessage('Biodata tersimpan. Lanjut upload CV agar AI bisa membaca kecocokan pekerjaan.');
    goToPage('cv');
  };

  const handleAnalyzeProfile = async (file = null) => {
    if (!isBiodataComplete) {
      setShowBiodataErrors(true);
      setStatusMessage(`Semua biodata wajib diisi. Masih kosong: ${formatMissingFields(missingBiodataFields)}.`);
      goToPage('biodata', { force: true });
      return;
    }

    if (!file) {
      setShowCvErrors(true);
      setStatusMessage('Upload CV PDF dulu sebelum scan dan lanjut ke job match.');
      goToPage('cv', { force: true });
      return;
    }

    if (!isCvSummaryFilled) {
      setShowCvErrors(true);
      setStatusMessage('Ringkasan profil juga wajib diisi sebelum scan CV.');
      goToPage('cv', { force: true });
      return;
    }

    setIsUploading(true);
    setShowCvErrors(false);
    setStatusMessage('Memetakan biodata dan CV ke kebutuhan pekerjaan...');

    try {
      const profileText = [formatBiodataText(biodata), cvText].filter(Boolean).join('\n\n');
      const response = await uploadCv(file, activeRole.domain || 'technology', targetRole, profileText);
      setAnalysis(response.data);
      setExtractedCvText(response.data.extractedCvText || '');
      setRecommendation(null);
      setQuizResult(null);
      setMiniQuizAnswer(null);
      setHasScannedCv(true);
      if (response.data.suggestedRoleId) {
        setTargetRole(response.data.suggestedRoleId);
      }
      const topMatch = response.data.jobMatches?.[0];
      setStatusMessage(
        topMatch
          ? `Scan selesai. Rekomendasi teratas: ${topMatch.name} dengan kecocokan ${topMatch.matchScore}%.`
          : 'Analisis selesai. Dasbor rekomendasi sudah diperbarui.'
      );
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

      if (!isBiodataComplete) {
        setShowBiodataErrors(true);
        setStatusMessage(`Lengkapi semua biodata dulu sebelum upload CV. Masih kosong: ${formatMissingFields(missingBiodataFields)}.`);
        event.target.value = '';
        goToPage('biodata', { force: true });
        return;
      }

      setSelectedCvFile(file);
      setHasScannedCv(false);
      setRecommendation(null);
      setQuizResult(null);
      setMiniQuizAnswer(null);
      setExtractedCvText('');
      setShowCvErrors(false);
      setStatusMessage(`File ${file.name} siap discan. Klik "Scan CV & Lihat Job Match" untuk lanjut.`);
      goToPage('cv');
      event.target.value = '';
    }
  };

  const handleTargetRoleChange = (event) => {
    const nextRole = event.target.value;
    const role = roles.find((item) => item.id === nextRole);
    setTargetRole(nextRole);
    setRecommendation(null);
    setQuizResult(null);
    setMiniQuizAnswer(null);
    if (role) {
      setAnalysis((current) => ({
        ...current,
        targetRole: role.name,
        targetRoleId: role.id,
        businessGoal: role.businessGoal,
        marketSignals: role.marketSignals,
        skillGap: role.requiredSkills?.slice(0, 4) || current.skillGap,
        roadmap: (role.requiredSkills || []).slice(0, 3).map((skill, index) => ({
          id: `${role.id}-preview-${index + 1}`,
          title: `Validasi ${skill}`,
          focus: skill,
          duration: index < 2 ? '1-2 minggu' : '2-3 minggu',
          action: `Buat latihan atau artefak portofolio kecil yang membuktikan kemampuan ${skill}.`
        }))
      }));
    }
    setStatusMessage(`Target role diubah ke ${role?.name || 'role pilihan'}. Jalankan analisis agar hasilnya ikut menyesuaikan.`);
  };

  const handleQuizSubmit = async () => {
    if (!miniQuizAnswer) {
      setStatusMessage('Pilih YES atau NO dulu agar rekomendasi akhirnya bisa ditentukan.');
      return;
    }

    setIsSubmittingQuiz(true);
    setStatusMessage('Membaca jawaban mini quiz dan memperbarui rekomendasi akhir...');

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
      setStatusMessage(
        miniQuizAnswer === 'yes'
          ? `YES tercatat. Skor kesiapan akhir: ${quizScore}%, lanjut ke rekomendasi karier.`
          : `NO tercatat. Skor kesiapan akhir: ${quizScore}%, sistem menampilkan prioritas e-course dulu.`
      );
      goToPage('dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'Pengiriman kuis gagal. Silakan coba lagi.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleStartJourney = async () => {
    try {
      const response = await saveLead(email, targetRole);
      setStatusMessage(response.data.message || 'Permintaan perjalanan belajar diterima.');
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.message || 'Masukkan alamat email yang valid.');
    }
  };

  return (
    <div className={`page-shell page-${currentPage}`}>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => goToPage('biodata')} aria-label="Beranda SkillMap">
          SkillMap
        </button>

        <nav className="site-nav" aria-label="Navigasi utama">
          {flowPages.map((page) => {
            const blockedMessage = getPageBlockMessage(page.id);
            return (
              <button
                className={currentPage === page.id ? 'active' : ''}
                key={page.id}
                type="button"
                onClick={() => goToPage(page.id)}
                disabled={Boolean(blockedMessage)}
                title={blockedMessage || page.title}
              >
                {page.label}
              </button>
            );
          })}
        </nav>

        <button className="nav-cta" type="button" onClick={() => goToPage('biodata')}>Mulai</button>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <Icon name="spark" size={14} />
              Navigasi karier berbasis AI
            </span>
            <h1>
              Dari biodata dan CV ke rekomendasi karier yang jelas.
            </h1>
            <p>
              Isi biodata seperti portal lowongan kerja, upload CV, lalu biarkan AI menghitung
              persentase kecocokan pekerjaan. Mini quiz YES/NO membantu menentukan apakah kamu
              lanjut ke rekomendasi karier atau mulai dari pilihan e-course dulu.
            </p>

            <div className="role-selector">
              <label htmlFor="target-role">Target role awal</label>
              <select id="target-role" value={targetRole} onChange={handleTargetRoleChange}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p>{activeRole.audience || 'Mahasiswa tingkat akhir dan fresh graduate'} - {activeRole.businessGoal}</p>
            </div>

            <div className="hero-actions">
              <input
                className="sr-only"
                id="cv-upload-hero"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleUpload}
              />
              <label className="primary-button" htmlFor="cv-upload-hero" aria-disabled={isUploading}>
                <Icon name="upload" size={16} />
                {isUploading ? 'Menganalisis...' : 'Unggah CV PDF'}
              </label>
              <button className="secondary-button" type="button" onClick={() => handleAnalyzeProfile()}>
                <Icon name="play" size={17} />
                Cek Kelengkapan
              </button>
            </div>

            <p className="status-line">{statusMessage}</p>
            <div className="mentor-note">
              <span>Catatan flow</span>
              <p>Urutannya dibuat sengaja: biodata dulu, CV kedua, hasil match ketiga, lalu mini quiz untuk keputusan akhir.</p>
            </div>

            <div className="human-step-strip" aria-label="Alur singkat penggunaan SkillMap">
              {humanSteps.map((step) => (
                <div className="human-step" key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DashboardVisual analysis={currentInsight} />
        </section>

        <section className="journey-section" id="features">
          <div className="section-heading">
            <h2>Alur Pengguna SkillMap</h2>
            <p>
              Flow dibuat seperti career matcher: data pelamar masuk dulu, AI membaca CV,
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

          <p className="status-line workspace-status">{statusMessage}</p>

          <div className="workspace-grid">
            <article className="workspace-panel biodata-panel">
              <div className="panel-label">01 / Biodata JobStreet</div>
              <h3>Isi profil dasar pelamar</h3>
              <p className="panel-helper">
                Biodata ini membantu AI membaca konteks CV: domisili, pendidikan, posisi yang diminati, dan pengalaman awal.
              </p>

              <div className="biodata-progress">
                <span>{biodataFilledCount} dari {Object.keys(initialBiodata).length} data terisi</span>
                <div className="progress-track" aria-label={`Progres biodata ${biodataProgress}%`}>
                  <span style={{ width: `${biodataProgress}%` }} />
                </div>
              </div>

              <div className="biodata-grid">
                {biodataFields.map((field) => (
                  <div className={`field-group ${field.wide ? 'wide' : ''}`} key={field.id}>
                    <label className="field-label" htmlFor={`biodata-${field.id}`}>
                      {field.label}
                      <span className="required-mark" aria-label="wajib">*</span>
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
                        value={biodata[field.id]}
                        onChange={(event) => handleBiodataChange(field.id, event.target.value)}
                        placeholder={field.placeholder}
                        required
                        aria-invalid={showBiodataErrors && missingBiodataIds.has(field.id)}
                      />
                    )}
                    {showBiodataErrors && missingBiodataIds.has(field.id) && (
                      <span className="field-error">Bagian ini wajib diisi.</span>
                    )}
                  </div>
                ))}
              </div>

              <button className="primary-button panel-action" type="button" onClick={handleSaveBiodata}>
                {isBiodataSaved ? 'Lanjut ke Upload CV' : 'Simpan & Lanjut Upload CV'}
              </button>
            </article>

            <article className="workspace-panel cv-panel">
              <div className="panel-label">02 / Upload & Scan CV</div>
              <h3>Upload CV PDF untuk dibaca AI</h3>
              <p className="panel-helper">
                AI mengubah isi PDF menjadi teks, lalu menggabungkannya dengan biodata untuk mendeteksi skill, job match, dan gap.
              </p>
              <div className="role-requirement-box">
                <span>Kebutuhan role yang dipakai sistem</span>
                <div className="chip-row">
                  {activeRole.requiredSkills?.map((skill) => (
                    <span className="chip soft" key={skill}>{skill}</span>
                  ))}
                </div>
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
              <label className="field-label" htmlFor="profile-summary">
                Ringkasan profil
                <span className="required-mark" aria-label="wajib">*</span>
              </label>
              <textarea
                className={showCvErrors && !isCvSummaryFilled ? 'field-invalid' : ''}
                id="profile-summary"
                value={cvText}
                onChange={(event) => {
                  setCvText(event.target.value);
                  setHasScannedCv(false);
                  setRecommendation(null);
                  setQuizResult(null);
                  setMiniQuizAnswer(null);
                }}
                placeholder="Contoh: saya pernah membuat aplikasi React, ikut proyek API, mengerjakan dashboard, atau belajar database..."
                required
                aria-invalid={showCvErrors && !isCvSummaryFilled}
              />
              {showCvErrors && !isCvSummaryFilled && (
                <p className="field-error">Ringkasan profil wajib diisi.</p>
              )}
              <div className="textarea-actions">
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setCvText(sampleCvText);
                    setHasScannedCv(false);
                    setRecommendation(null);
                    setQuizResult(null);
                    setMiniQuizAnswer(null);
                  }}
                >
                  Gunakan contoh
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setCvText('');
                    setHasScannedCv(false);
                    setRecommendation(null);
                    setQuizResult(null);
                    setMiniQuizAnswer(null);
                  }}
                >
                  Kosongkan
                </button>
              </div>
              <button
                className="primary-button panel-action"
                type="button"
                onClick={() => handleAnalyzeProfile(selectedCvFile)}
                disabled={isUploading}
              >
                Scan CV & Lihat Job Match
              </button>

              {extractedCvText && (
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

              <div className="result-block">
                <span>Skill terdeteksi</span>
                <div className="chip-row">
                  {analysis.extractedSkills?.map((skill) => (
                    <span className="chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="result-block">
                <span>Gap prioritas</span>
                <div className="chip-row">
                  {analysis.skillGap?.map((gap) => (
                    <span className="chip ghost" key={gap}>{gap}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="workspace-panel match-panel">
              <div className="panel-label">03 / Rekomendasi Pekerjaan</div>
              <h3>Persentase kecocokan dari AI</h3>
              <p className="panel-helper">
                {hasScannedCv
                  ? 'Hasil ini berasal dari biodata dan CV terbaru yang kamu kirim.'
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

              <button className="primary-button panel-action" type="button" onClick={() => goToPage('quiz')}>
                Lanjut Mini Quiz
              </button>
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

              <button
                className="primary-button panel-action"
                type="button"
                onClick={handleQuizSubmit}
                disabled={isSubmittingQuiz || !miniQuizAnswer}
              >
                {isSubmittingQuiz ? 'Menghitung...' : 'Lihat Rekomendasi Akhir'}
              </button>

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
          <div className="section-heading compact">
            <span className="page-counter">Langkah 05 dari 05</span>
            <h2>Dashboard Personal</h2>
            <p>Hasilnya dibuat ringkas: skor kesiapan, fokus utama, dan roadmap yang bisa mulai dikerjakan.</p>
          </div>

          <p className="status-line workspace-status">{statusMessage}</p>

          <article className="workspace-panel roadmap-panel-card">
            <div className="panel-label">05 / Dasbor Personal</div>
            <h3>Ringkasan akhir rekomendasi</h3>

            <div className="dashboard-result-grid">
              <div className="readiness-card">
                <strong>{currentInsight.readinessScore ?? analysis.readinessScore}%</strong>
                <span>{currentInsight.readinessLabel || 'fokus bertahap'}</span>
              </div>

              <div className="role-summary">
                <span>Tujuan utama</span>
                <p>{careerRecommendation.summary || activeRole.businessGoal || analysis.businessGoal}</p>
              </div>
            </div>

            <div className="market-signal-card">
              <span>Sinyal kebutuhan industri</span>
              <div>
                {(currentInsight.marketSignals || activeRole.marketSignals || []).map((signal) => (
                  <strong key={signal}>{signal}</strong>
                ))}
              </div>
            </div>

            {miniQuizAnswer && (
              <div className={`branch-result dashboard-branch ${miniQuizAnswer === 'yes' ? 'career' : 'course'}`}>
                <span>{miniQuizAnswer === 'yes' ? 'Keputusan mini quiz: YES' : 'Keputusan mini quiz: NO'}</span>
                <strong>{miniQuizAnswer === 'yes' ? careerRecommendation.title : 'Mulai dari e-course dulu'}</strong>
                <p>
                  {miniQuizAnswer === 'yes'
                    ? 'Sistem mengarahkan user ke rekomendasi karier karena sinyal kesiapan personal positif.'
                    : `Sistem menyarankan belajar ${courseRecommendations[0]?.skill || topGaps[0]} sebelum lanjut melamar.`}
                </p>
                {miniQuizAnswer === 'no' && courseRecommendations[0]?.url && (
                  <a
                    className="course-direct-link compact"
                    href={courseRecommendations[0].url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => openCourse(event, courseRecommendations[0].url)}
                  >
                    Buka course utama
                  </a>
                )}
              </div>
            )}

            <div className="human-result-grid">
              <div className="human-result-card">
                <span>Yang sudah bisa kamu andalkan</span>
                <div className="chip-row">
                  {topStrengths.map((skill) => (
                    <span className="chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="human-result-card warm">
                <span>Yang sebaiknya jadi fokus dulu</span>
                <div className="chip-row">
                  {topGaps.map((gap) => (
                    <span className="chip ghost" key={gap}>{gap}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="next-action-card">
              <span>Langkah pertama yang disarankan</span>
              <p>
                {miniQuizAnswer === 'no'
                  ? (
                    <>
                      Mulai dari e-course <CourseInlineLink course={courseRecommendations[0]} />, lalu ulangi mini quiz setelah latihan.
                    </>
                  )
                  : `Mulai dari ${topGaps[0] || 'roadmap paling atas'}, buat latihan kecil, lalu simpan hasilnya sebagai bukti portofolio.`}
              </p>
            </div>

            <div className="roadmap-list">
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

            <div className="tech-coverage">
              {(dashboard?.compliance?.frontend || ['React', 'Vite', 'Panggilan API dengan Axios']).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            {dashboard?.activity && (
              <div className="activity-summary">
                <span>Aktivitas demo tersimpan</span>
                <div>
                  <p>{dashboard.activity.cvAnalyses?.length || 0} analisis CV</p>
                  <p>{dashboard.activity.quizAttempts?.length || 0} hasil kuis</p>
                  <p>{dashboard.activity.leads?.length || 0} lead email</p>
                </div>
              </div>
            )}

            <div className="page-actions">
              <button className="secondary-button" type="button" onClick={() => goToPage('quiz')}>
                Kembali ke Mini Quiz
              </button>
              <button className="primary-button" type="button" onClick={() => goToPage('biodata')}>
                Ulangi dari Biodata
              </button>
            </div>
          </article>
        </section>

        <section className="insight-section">
          <div className="insight-copy">
            <span className="section-kicker">Kesesuaian proyek</span>
            <h2>Tetap siap untuk kebutuhan capstone</h2>
            <p>
              Di balik tampilan yang lebih ramah, MVP ini tetap punya endpoint RESTful Flask
              untuk unggah CV, kuis, rekomendasi, dasbor, dan penyimpanan email. Jalur AI/ML
              dan Data Science juga tetap punya ruang integrasi.
            </p>
            {researchQuestions.length > 0 && (
              <div className="research-box">
                <span>Research question</span>
                {researchQuestions.map((question) => (
                  <p key={question}>{question}</p>
                ))}
              </div>
            )}
          </div>

          <div className="capstone-panel">
            <div className="capstone-module-list">
              <span>Fitur MVP</span>
              {(capstoneModules.length ? capstoneModules : [
                'Ekstraksi skill dari CV',
                'Kuis adaptif',
                'Pemetaan skill gap',
                'Jalur belajar personal',
                'Insight dasbor'
              ]).map((item) => (
                <div className="requirement-item" key={item}>
                  <Icon name="check" size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="coverage-grid">
              {Object.entries(dashboard?.compliance || projectRequirements?.technicalCoverage || {}).map(([area, items]) => (
                <div className="coverage-card" key={area}>
                  <span>{area}</span>
                  {items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section" id="start">
          <div className="cta-panel">
            <h2>Simpan roadmap belajarmu</h2>
            <p>
              Tinggalkan email agar perjalanan belajarmu bisa dilanjutkan saat fitur akun sudah tersedia.
            </p>
            <div className="email-form">
              <div className="email-field">
                <label htmlFor="lead-email">Email untuk menyimpan progres</label>
                <input
                  id="lead-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button type="button" onClick={handleStartJourney}>
                Mulai Perjalanan
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div>
          <strong>SkillMap</strong>
          <p>2026 SkillMap AI. Navigator pembelajaran keterampilan yang dipersonalisasi.</p>
        </div>
        <nav aria-label="Navigasi footer">
          <button type="button" onClick={() => goToPage('cv')}>Unggah CV</button>
          <button type="button" onClick={() => goToPage('quiz')}>Mini Quiz</button>
          <button type="button" onClick={() => goToPage('dashboard')}>Dasbor</button>
          <button type="button" onClick={() => goToPage('matches')}>Job Match</button>
        </nav>
      </footer>
    </div>
  );
}

export default App;
