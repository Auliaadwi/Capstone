import { useEffect, useMemo, useState } from 'react';
import {
  createRecommendation,
  fetchDashboard,
  fetchQuizQuestions,
  fetchRoles,
  saveLead,
  submitQuiz,
  uploadCv
} from './api';

const defaultRole = {
  id: 'fullstack-web-developer',
  name: 'Junior Full-Stack Web Developer',
  domain: 'technology',
  requiredSkills: ['JavaScript', 'React', 'Express', 'REST API', 'PostgreSQL', 'Deployment', 'Testing'],
  businessGoal: 'Siap melamar role full-stack junior dengan portofolio end-to-end.',
  marketSignals: ['React + API integration', 'RESTful backend', 'database persistence', 'public deployment']
};

const initialAnalysis = {
  extractedSkills: ['JavaScript', 'React', 'Problem Solving'],
  skillGap: ['Express', 'PostgreSQL', 'Deployment'],
  recommendation: [
    'Focus on Junior Full-Stack Web Developer requirements before applying.',
    'Create Express routes for CV upload, quiz, recommendations, and dashboard data.',
    'Persist users, CV analysis, quiz attempts, and learning paths in PostgreSQL.',
    'Publish progress as portfolio evidence for recruiters.'
  ],
  roadmap: [
    {
      id: 'step-1',
      title: 'Close Express gap',
      duration: '1-2 weeks',
      action: 'Create Express routes for CV upload, quiz, recommendations, and dashboard data.'
    },
    {
      id: 'step-2',
      title: 'Close PostgreSQL gap',
      duration: '1-2 weeks',
      action: 'Persist users, CV analysis, quiz attempts, and learning paths in PostgreSQL.'
    },
    {
      id: 'step-3',
      title: 'Close Deployment gap',
      duration: '2-3 weeks',
      action: 'Deploy the frontend and API, then connect production environment variables.'
    }
  ],
  confidence: 0.82,
  readinessScore: 76,
  readinessLabel: 'nearly ready',
  targetRole: defaultRole.name,
  targetRoleId: defaultRole.id,
  marketSignals: defaultRole.marketSignals,
  businessGoal: defaultRole.businessGoal
};

const sampleCvText =
  'Fresh graduate with JavaScript, React, Vite, responsive UI, API integration, communication, and portfolio project experience.';

const journeyCards = [
  {
    icon: 'scan',
    title: 'CV Skill Diagnosis',
    description:
      'Extract skills from a CV or profile summary, then compare them with role requirements for fresh graduates.',
    points: ['NLP-style skill extraction', 'Industry skill baseline']
  },
  {
    icon: 'brain',
    title: 'Adaptive Readiness Quiz',
    description:
      'Measure practical confidence through quiz signals so SkillMap does not rely on CV keywords alone.',
    points: ['Role-based questions', 'Readiness scoring']
  },
  {
    icon: 'map',
    title: 'Personal Learning Path',
    description:
      'Turn skill gaps into concrete learning steps, portfolio tasks, and deployment-ready proof of work.',
    points: ['Skill gap mapping', 'Roadmap recommendation']
  }
];

const barRows = [
  [52, 70, 43, 86, 61, 74, 48, 92, 67, 58],
  [28, 45, 66, 37, 82, 54, 77, 34, 72, 49],
  [62, 31, 58, 79, 46, 68, 88, 40, 73, 55]
];

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

  return (
    <div className="hero-visual" aria-label="Skill analytics dashboard preview">
      <div className="visual-frame">
        <div className="dashboard-screen">
          <div className="screen-toolbar">
            <span />
            <span />
            <span />
          </div>

          <div className="dashboard-grid">
            <div className="chart-panel large">
              <div className="chart-title">Readiness Growth</div>
              <div className="line-chart">
                <span />
              </div>
            </div>

            <div className="score-row">
              <span>{score}%</span>
              <span>{Math.max(score - 12, 0)}%</span>
              <span>{Math.min(score + 3, 100)}%</span>
            </div>

            {barRows.map((row, rowIndex) => (
              <div className="bar-panel" key={rowIndex}>
                {row.map((height, index) => (
                  <span key={`${rowIndex}-${index}`} style={{ height: `${height}%` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="floating-badge skill-badge">
        <span className="badge-icon">
          <Icon name="check" size={15} />
        </span>
        <strong>{primarySkill} Skill</strong>
        <span>{score}% Ready</span>
      </div>

      <div className="floating-badge gap-badge">
        <span className="badge-icon muted">
          <Icon name="trend" size={16} />
        </span>
        <strong>Priority Gap</strong>
        <span>{primaryGap}</span>
      </div>
    </div>
  );
}

function App() {
  const [roles, setRoles] = useState([defaultRole]);
  const [targetRole, setTargetRole] = useState(defaultRole.id);
  const [dashboard, setDashboard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [quizResult, setQuizResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [cvText, setCvText] = useState(sampleCvText);
  const [email, setEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Upload your CV or paste a profile summary to start.');

  const activeRole = useMemo(
    () => roles.find((role) => role.id === targetRole) || defaultRole,
    [roles, targetRole]
  );

  const activeRoadmap = recommendation?.roadmap || analysis.roadmap || [];
  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [rolesResponse, dashboardResponse] = await Promise.all([fetchRoles(), fetchDashboard()]);
        setRoles(rolesResponse.data.roles?.length ? rolesResponse.data.roles : [defaultRole]);
        setDashboard(dashboardResponse.data);
      } catch (error) {
        setStatusMessage(error.message || 'Failed to connect to SkillMap API.');
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetchQuizQuestions(activeRole.domain || 'technology', targetRole);
        setQuestions(response.data.questions || []);
        setSelectedAnswers({});
      } catch (error) {
        setStatusMessage(error.message || 'Failed to load adaptive quiz.');
      }
    };

    loadQuestions();
  }, [activeRole.domain, targetRole]);

  const handleAnalyzeProfile = async (file = null) => {
    setIsUploading(true);
    setStatusMessage('Mapping CV skills against the selected target role...');

    try {
      const response = await uploadCv(file, activeRole.domain || 'technology', targetRole, cvText);
      setAnalysis(response.data);
      setRecommendation(null);
      setStatusMessage(`Analysis complete for ${response.data.targetRole}.`);
    } catch (error) {
      setStatusMessage(error.message || 'CV analysis failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleAnalyzeProfile(file);
      event.target.value = '';
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex
    }));
  };

  const handleQuizSubmit = async () => {
    setIsSubmittingQuiz(true);
    setStatusMessage('Scoring quiz and refreshing your personalized roadmap...');

    try {
      const answers = questions.map((_question, index) => selectedAnswers[index] ?? null);
      const quizResponse = await submitQuiz(answers, activeRole.domain || 'technology', targetRole);
      setQuizResult(quizResponse.data);

      const recommendationResponse = await createRecommendation({
        targetRole,
        extractedSkills: analysis.extractedSkills,
        quizScore: quizResponse.data.score
      });
      setRecommendation(recommendationResponse.data);
      setStatusMessage(`Quiz submitted. Current readiness: ${quizResponse.data.score}%.`);
    } catch (error) {
      setStatusMessage(error.message || 'Quiz submission failed. Please try again.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleStartJourney = async () => {
    try {
      const response = await saveLead(email, targetRole);
      setStatusMessage(response.data.message || 'Journey request received.');
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.message || 'Please enter a valid email address.');
    }
  };

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="SkillMap home">
          SkillMap
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a className="active" href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#workspace">Skill Check</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="nav-cta" href="#workspace">Get Started</a>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <Icon name="spark" size={14} />
              AI-powered career navigation
            </span>
            <h1>
              Know Your Skills.
              <span>Build Your Future.</span>
            </h1>
            <p>
              SkillMap helps final-year students and fresh graduates diagnose CV gaps, validate
              readiness through an adaptive quiz, and generate a focused learning roadmap before applying.
            </p>

            <div className="role-control">
              <label htmlFor="target-role">Target role</label>
              <select id="target-role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hero-actions">
              <input
                className="sr-only"
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleUpload}
              />
              <label className="primary-button" htmlFor="cv-upload" aria-disabled={isUploading}>
                <Icon name="upload" size={16} />
                {isUploading ? 'Analyzing...' : 'Upload CV'}
              </label>
              <button className="secondary-button" type="button" onClick={() => handleAnalyzeProfile()}>
                <Icon name="play" size={17} />
                Run Demo
              </button>
            </div>

            <p className="status-line">{statusMessage}</p>
          </div>

          <DashboardVisual analysis={recommendation || analysis} />
        </section>

        <section className="journey-section" id="features">
          <div className="section-heading">
            <h2>Designed Around SkillMap's MVP</h2>
            <p>
              The flow follows your project plan: CV analysis, adaptive quiz, skill gap detection,
              and personalized learning path recommendations.
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
            <h2>Skill Check Workspace</h2>
            <p>One integrated workspace for the main demo: CV input, quiz validation, and roadmap output.</p>
          </div>

          <div className="workspace-grid">
            <article className="workspace-panel cv-panel">
              <div className="panel-label">01 / CV Diagnosis</div>
              <h3>Map CV to role requirements</h3>
              <textarea
                value={cvText}
                onChange={(event) => setCvText(event.target.value)}
                placeholder="Paste CV summary, skills, projects, or job experience here..."
              />
              <button className="primary-button panel-action" type="button" onClick={() => handleAnalyzeProfile()}>
                Analyze Profile
              </button>

              <div className="result-block">
                <span>Detected skills</span>
                <div className="chip-row">
                  {analysis.extractedSkills?.map((skill) => (
                    <span className="chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="result-block">
                <span>Priority gaps</span>
                <div className="chip-row">
                  {analysis.skillGap?.map((gap) => (
                    <span className="chip ghost" key={gap}>{gap}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="workspace-panel quiz-panel">
              <div className="panel-label">02 / Adaptive Quiz</div>
              <h3>Validate practical readiness</h3>
              <p className="panel-copy">{answeredCount} of {questions.length} questions answered</p>

              <div className="quiz-list">
                {questions.map((question, questionIndex) => (
                  <div className="quiz-item" key={question.id}>
                    <p>{question.prompt}</p>
                    <div className="option-grid">
                      {question.options.map((option, optionIndex) => {
                        const isActive = selectedAnswers[questionIndex] === optionIndex;
                        return (
                          <button
                            className={`option-button ${isActive ? 'active' : ''}`}
                            key={option}
                            type="button"
                            onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="primary-button panel-action"
                type="button"
                onClick={handleQuizSubmit}
                disabled={isSubmittingQuiz}
              >
                {isSubmittingQuiz ? 'Scoring...' : 'Submit Quiz'}
              </button>

              {quizResult && (
                <div className="score-card">
                  <strong>{quizResult.score}%</strong>
                  <span>{quizResult.track}</span>
                  <p>{quizResult.recommendation}</p>
                </div>
              )}
            </article>

            <article className="workspace-panel roadmap-panel-card" id="dashboard">
              <div className="panel-label">03 / Personalized Dashboard</div>
              <h3>{(recommendation || analysis).targetRole}</h3>

              <div className="readiness-card">
                <strong>{(recommendation || analysis).readinessScore ?? analysis.readinessScore}%</strong>
                <span>{(recommendation || analysis).readinessLabel}</span>
              </div>

              <div className="role-summary">
                <span>Business goal</span>
                <p>{activeRole.businessGoal || analysis.businessGoal}</p>
              </div>

              <div className="roadmap-list">
                {activeRoadmap.map((step, index) => (
                  <div className="roadmap-step" key={step.id || step.action}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{step.action || step}</p>
                  </div>
                ))}
              </div>

              <div className="tech-coverage">
                {(dashboard?.compliance?.frontend || ['React', 'Vite', 'Axios networking calls']).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="insight-section">
          <div className="insight-copy">
            <span className="section-kicker">Project alignment</span>
            <h2>Built For The Capstone Requirements</h2>
            <p>
              The MVP now exposes RESTful Express endpoints for CV upload, quiz, recommendation,
              dashboard, roles, and lead capture. The AI/ML and Data Science tracks have clear
              integration points for model serving, EDA insight, and Streamlit reporting.
            </p>
          </div>

          <div className="requirement-panel">
            {[
              'Express REST API',
              'PostgreSQL-ready persistence',
              'React + Vite module bundler',
              'Axios networking calls',
              'AI/ML recommendation contract',
              'Responsive UI mockup'
            ].map((item) => (
              <div className="requirement-item" key={item}>
                <Icon name="check" size={14} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section" id="start">
          <div className="cta-panel">
            <h2>Ready to Map Your Future?</h2>
            <p>
              Save a journey request and continue from the role-focused roadmap once the full
              authentication flow is added.
            </p>
            <div className="email-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="button" onClick={handleStartJourney}>
                Start Journey
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div>
          <strong>SkillMap</strong>
          <p>© 2026 SkillMap AI. Navigator pembelajaran keterampilan yang dipersonalisasi.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#workspace">Upload CV</a>
          <a href="#workspace">Adaptive Quiz</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#features">Learning Path</a>
        </nav>
      </footer>
    </div>
  );
}

export default App;
