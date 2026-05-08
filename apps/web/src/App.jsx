import { useEffect, useState } from 'react';
import { createRecommendation, fetchDashboard, fetchQuizQuestions, saveLead, submitQuiz, uploadCv } from './api';

const DEMO_MATCHES = [
  { id: 'fullstack-web-developer', name: 'Junior Full-Stack Web Developer', matchScore: 62, businessGoal: 'Siap melamar role full-stack junior dengan portofolio end-to-end.', marketSignals: ['React + API', 'RESTful backend', 'database', 'deployment'] },
  { id: 'data-scientist', name: 'Junior Data Scientist', matchScore: 47, businessGoal: 'Mampu mengubah dataset menjadi insight siap dashboard.', marketSignals: ['data cleaning', 'EDA', 'Streamlit'] },
  { id: 'ai-engineer', name: 'Junior AI Engineer', matchScore: 35, businessGoal: 'Membangun model NLP untuk ekstraksi skill dan rekomendasi.', marketSignals: ['TensorFlow', 'NLP', 'model serving'] }
];

const DEMO_ANALYSIS = {
  extractedSkills: ['JavaScript', 'React', 'Problem Solving'],
  skillGap: ['Express', 'PostgreSQL', 'Deployment'],
  jobMatches: DEMO_MATCHES,
  suggestedRoleId: 'fullstack-web-developer',
  recommendation: ['Focus on Full-Stack requirements.', 'Build Express API routes.', 'Persist data in PostgreSQL.', 'Publish portfolio evidence.'],
  roadmap: [
    { id: 's1', title: 'Close Express gap', duration: '1-2 weeks', action: 'Create Express routes for CV upload, quiz, and dashboard data.' },
    { id: 's2', title: 'Close PostgreSQL gap', duration: '1-2 weeks', action: 'Persist users, CV analysis, quiz attempts in PostgreSQL.' },
    { id: 's3', title: 'Close Deployment gap', duration: '2-3 weeks', action: 'Deploy frontend and API, connect production env variables.' }
  ],
  confidence: 0.62, readinessScore: 62, readinessLabel: 'nearly ready'
};

const SAMPLE_CV = 'Fresh graduate with JavaScript, React, Vite, responsive UI, API integration, communication, and portfolio project experience.';

const JOURNEY_CARDS = [
  { icon: 'scan', title: 'CV Skill Diagnosis', desc: 'Extract skills from your CV, then compare them with all available role profiles automatically.', points: ['NLP-style skill extraction', 'Multi-role comparison'] },
  { icon: 'brain', title: 'AI Job Matching', desc: 'See which roles fit your profile best, ranked by match percentage from your extracted skills.', points: ['Ranked role suggestions', 'Instant AI scoring'] },
  { icon: 'map', title: 'Personal Learning Path', desc: 'Take a short quiz for your chosen role, then receive a focused roadmap to close your skill gaps.', points: ['Quiz-validated readiness', 'Actionable roadmap'] }
];

function Icon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
  if (name === 'upload') return <svg {...p}><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>;
  if (name === 'play') return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8Z"/></svg>;
  if (name === 'spark') return <svg {...p}><path d="m12 3 1.8 4.6L18 9.2l-4.2 1.6L12 15l-1.8-4.2L6 9.2l4.2-1.6L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>;
  if (name === 'scan') return <svg {...p}><path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>;
  if (name === 'brain') return <svg {...p}><path d="M8 5a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2.2"/><path d="M16 5a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2.2"/><path d="M12 5v14"/></svg>;
  if (name === 'map') return <svg {...p}><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>;
  if (name === 'check') return <svg {...p}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === 'trend') return <svg {...p}><path d="m4 16 5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>;
  if (name === 'arrow') return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
  if (name === 'reset') return <svg {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
  return null;
}

function StepIndicator({ step }) {
  const steps = ['Upload CV', 'Job Matches', 'Quiz', 'Learning Path'];
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const n = i + 1;
        return (
          <div key={label} className="step-item">
            <div className={`step-dot ${step === n ? 'active' : step > n ? 'done' : ''}`}>
              {step > n ? <Icon name="check" size={11} /> : n}
            </div>
            <span className={`step-label ${step === n ? 'active' : ''}`}>{label}</span>
            {i < steps.length - 1 && <div className={`step-conn ${step > n ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

function JobMatchPanel({ jobMatches, selectedRoleId, onSelect, onContinue }) {
  return (
    <article className="workspace-panel match-panel">
      <div className="panel-label">02 / Saran Karier AI</div>
      <h3>Pekerjaan yang Cocok untuk CV Kamu</h3>
      <p className="panel-copy">AI menganalisis skillmu dan menemukan kecocokan berikut. Pilih satu role untuk lanjut ke quiz.</p>
      <div className="match-list">
        {jobMatches.map((job, i) => (
          <button key={job.id} className={`match-row ${selectedRoleId === job.id ? 'selected' : ''}`} onClick={() => onSelect(job.id)} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="match-bar-track">
              <div className="match-bar-fill" style={{ width: `${job.matchScore}%` }} />
            </div>
            <span className="match-pct">{job.matchScore}%</span>
            <span className="match-name">{job.name}</span>
          </button>
        ))}
      </div>
      <button className="primary-button panel-action" type="button" onClick={onContinue} disabled={!selectedRoleId}>
        <Icon name="arrow" size={16} /> Lanjut ke Quiz
      </button>
    </article>
  );
}

function HeroVisual({ analysis }) {
  const score = analysis.readinessScore ?? 62;
  const skill = analysis.extractedSkills?.[0] || 'JavaScript';
  const gap = analysis.skillGap?.[0] || 'Express';
  const rows = [[52,70,43,86,61,74,48,92,67,58],[28,45,66,37,82,54,77,34,72,49],[62,31,58,79,46,68,88,40,73,55]];
  return (
    <div className="hero-visual" aria-label="Skill analytics dashboard preview">
      <div className="visual-frame">
        <div className="dashboard-screen">
          <div className="screen-toolbar"><span/><span/><span/></div>
          <div className="dashboard-grid">
            <div className="chart-panel large"><div className="chart-title">Readiness Growth</div><div className="line-chart"><span/></div></div>
            <div className="score-row"><span>{score}%</span><span>{Math.max(score-12,0)}%</span><span>{Math.min(score+3,100)}%</span></div>
            {rows.map((row, ri) => <div className="bar-panel" key={ri}>{row.map((h,i) => <span key={i} style={{height:`${h}%`}}/>)}</div>)}
          </div>
        </div>
      </div>
      <div className="floating-badge skill-badge"><span className="badge-icon"><Icon name="check" size={15}/></span><strong>{skill} Skill</strong><span>{score}% Ready</span></div>
      <div className="floating-badge gap-badge"><span className="badge-icon muted"><Icon name="trend" size={16}/></span><strong>Priority Gap</strong><span>{gap}</span></div>
    </div>
  );
}

function App() {
  const [step, setStep] = useState(1);
  const [analysis, setAnalysis] = useState(DEMO_ANALYSIS);
  const [selectedRoleId, setSelectedRoleId] = useState(DEMO_ANALYSIS.suggestedRoleId);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [cvText, setCvText] = useState(SAMPLE_CV);
  const [email, setEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Upload CV atau paste ringkasan profil untuk memulai.');

  const activeMatch = analysis.jobMatches?.find(j => j.id === selectedRoleId) || analysis.jobMatches?.[0];
  const activeRoadmap = recommendation?.roadmap || analysis.roadmap || [];
  const answeredCount = Object.keys(selectedAnswers).length;

  useEffect(() => { fetchDashboard().catch(() => {}); }, []);

  const handleAnalyze = async (file = null) => {
    setIsUploading(true);
    setStatusMsg('Menganalisis CV dan mencocokkan dengan berbagai role...');
    try {
      const res = await uploadCv(file, 'technology', cvText);
      const data = res.data;
      setAnalysis(data);
      setSelectedRoleId(data.suggestedRoleId || data.jobMatches?.[0]?.id);
      setRecommendation(null);
      setStep(2);
      setStatusMsg(`Ditemukan ${data.jobMatches?.length || 0} role yang cocok dengan profilmu!`);
    } catch (e) {
      setStatusMsg(e.message || 'Analisis CV gagal. Coba lagi.');
    } finally { setIsUploading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) { await handleAnalyze(file); e.target.value = ''; }
  };

  const handleProceedToQuiz = async () => {
    setStep(3);
    setStatusMsg(`Memuat quiz untuk ${activeMatch?.name}...`);
    try {
      const res = await fetchQuizQuestions('technology', selectedRoleId);
      setQuestions(res.data.questions || []);
      setSelectedAnswers({});
      setStatusMsg(`Quiz siap! Jawab ${res.data.questions?.length || 0} pertanyaan untuk ${activeMatch?.name}.`);
    } catch (e) { setStatusMsg(e.message || 'Gagal memuat quiz.'); }
  };

  const handleAnswerSelect = (qi, oi) => setSelectedAnswers(c => ({ ...c, [qi]: oi }));

  const handleQuizSubmit = async () => {
    setIsSubmittingQuiz(true);
    setStatusMsg('Menghitung skor dan menyiapkan learning path...');
    try {
      const answers = questions.map((_, i) => selectedAnswers[i] ?? null);
      const qRes = await submitQuiz(answers, 'technology', selectedRoleId);
      setQuizResult(qRes.data);
      const rRes = await createRecommendation({ targetRole: selectedRoleId, extractedSkills: analysis.extractedSkills, quizScore: qRes.data.score });
      setRecommendation(rRes.data);
      setStep(4);
      setStatusMsg(`Quiz selesai! Readiness kamu: ${qRes.data.score}%.`);
    } catch (e) { setStatusMsg(e.message || 'Pengiriman quiz gagal.'); }
    finally { setIsSubmittingQuiz(false); }
  };

  const handleReset = () => {
    setStep(1); setAnalysis(DEMO_ANALYSIS); setSelectedRoleId(DEMO_ANALYSIS.suggestedRoleId);
    setQuestions([]); setSelectedAnswers({}); setQuizResult(null); setRecommendation(null);
    setStatusMsg('Upload CV atau paste ringkasan profil untuk memulai.');
  };

  const handleStartJourney = async () => {
    try {
      const res = await saveLead(email, selectedRoleId);
      setStatusMsg(res.data.message || 'Journey request diterima!');
    } catch (e) { setStatusMsg(e.response?.data?.error || e.message || 'Masukkan email yang valid.'); }
  };

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="SkillMap home">SkillMap</a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a className="active" href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#workspace">Skill Check</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#workspace">Get Started</a>
      </header>

      <main>
        {/* HERO */}
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="spark" size={14}/>AI-powered career navigation</span>
            <h1>Know Your Skills.<span>Build Your Future.</span></h1>
            <p>SkillMap membantu mahasiswa tingkat akhir dan fresh graduates mendiagnosis skill dari CV, menemukan role yang paling cocok, dan mendapatkan roadmap belajar yang personal.</p>
            <div className="hero-actions">
              <input className="sr-only" id="cv-upload-hero" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload}/>
              <label className="primary-button" htmlFor="cv-upload-hero" aria-disabled={isUploading}>
                <Icon name="upload" size={16}/>{isUploading ? 'Menganalisis...' : 'Upload CV'}
              </label>
              <button className="secondary-button" type="button" onClick={() => handleAnalyze()}>
                <Icon name="play" size={17}/>Run Demo
              </button>
            </div>
            <p className="status-line">{statusMsg}</p>
          </div>
          <HeroVisual analysis={recommendation || analysis}/>
        </section>

        {/* FEATURES */}
        <section className="journey-section" id="features">
          <div className="section-heading">
            <h2>Flow yang Dirancang untuk Kamu</h2>
            <p>Upload CV → AI temukan job match → Quiz validasi → Personal learning path.</p>
          </div>
          <div className="journey-grid">
            {JOURNEY_CARDS.map((c, i) => (
              <article className="journey-card" key={c.title}>
                <div className="card-icon"><Icon name={c.icon} size={23}/></div>
                <div className="card-step-num">0{i+1}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <ul>{c.points.map(pt => <li key={pt}><Icon name="check" size={13}/>{pt}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        {/* WORKSPACE — STEP BASED */}
        <section className="workspace-section" id="workspace">
          <div className="section-heading compact">
            <h2>Skill Check Workspace</h2>
            <p>Ikuti empat langkah untuk mendapatkan learning path yang dipersonalisasi.</p>
          </div>

          <StepIndicator step={step}/>

          <div className="workspace-content">

            {/* STEP 1 — Upload CV */}
            {step === 1 && (
              <article className="workspace-panel cv-panel">
                <div className="panel-label">01 / CV Diagnosis</div>
                <h3>Paste atau Upload CV Kamu</h3>
                <textarea value={cvText} onChange={e => setCvText(e.target.value)} placeholder="Paste ringkasan CV, skill, proyek, atau pengalaman kerja di sini..."/>
                <button className="primary-button panel-action" type="button" onClick={() => handleAnalyze()} disabled={isUploading}>
                  {isUploading ? 'Menganalisis...' : 'Analisis Profil'}
                </button>
                <div className="upload-alt">
                  <span>atau</span>
                  <input className="sr-only" id="cv-upload-ws" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload}/>
                  <label htmlFor="cv-upload-ws" className="upload-file-btn"><Icon name="upload" size={14}/>Upload File CV</label>
                </div>
                <div className="result-block">
                  <span>Skill yang terdeteksi (demo)</span>
                  <div className="chip-row">{DEMO_ANALYSIS.extractedSkills.map(s => <span className="chip" key={s}>{s}</span>)}</div>
                </div>
              </article>
            )}

            {/* STEP 2 — Job Matches */}
            {step === 2 && (
              <JobMatchPanel
                jobMatches={analysis.jobMatches || DEMO_MATCHES}
                selectedRoleId={selectedRoleId}
                onSelect={setSelectedRoleId}
                onContinue={handleProceedToQuiz}
              />
            )}

            {/* STEP 3 — Quiz */}
            {step === 3 && (
              <article className="workspace-panel quiz-panel">
                <div className="panel-label">03 / Adaptive Quiz</div>
                <h3>Validasi Kesiapanmu untuk {activeMatch?.name}</h3>
                <p className="panel-copy">{answeredCount} dari {questions.length} pertanyaan dijawab</p>
                <div className="quiz-list">
                  {questions.map((q, qi) => (
                    <div className="quiz-item" key={q.id}>
                      <p>{q.prompt}</p>
                      <div className="option-grid">
                        {q.options.map((opt, oi) => (
                          <button className={`option-button ${selectedAnswers[qi] === oi ? 'active' : ''}`} key={opt} type="button" onClick={() => handleAnswerSelect(qi, oi)}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="primary-button panel-action" type="button" onClick={handleQuizSubmit} disabled={isSubmittingQuiz}>
                  {isSubmittingQuiz ? 'Menghitung...' : 'Submit Quiz'}
                </button>
              </article>
            )}

            {/* STEP 4 — Learning Path */}
            {step === 4 && (
              <article className="workspace-panel roadmap-panel-card">
                <div className="panel-label">04 / Learning Path</div>
                <h3>{activeMatch?.name}</h3>
                {quizResult && (
                  <div className="score-card">
                    <strong>{quizResult.score}%</strong>
                    <span>{quizResult.track}</span>
                    <p>{quizResult.recommendation}</p>
                  </div>
                )}
                <div className="dashboard-result-grid">
                  <div className="readiness-card">
                    <strong>{(recommendation || analysis).readinessScore}%</strong>
                    <span>{(recommendation || analysis).readinessLabel}</span>
                  </div>
                  <div className="role-summary"><span>Business goal</span><p>{activeMatch?.businessGoal}</p></div>
                </div>
                <div className="roadmap-list">
                  {activeRoadmap.map((step, i) => (
                    <div className="roadmap-step" key={step.id || i}>
                      <span>{String(i+1).padStart(2,'0')}</span>
                      <p>{step.action || step}</p>
                    </div>
                  ))}
                </div>
                <button className="secondary-button reset-btn" type="button" onClick={handleReset}>
                  <Icon name="reset" size={15}/>Mulai Ulang
                </button>
              </article>
            )}

          </div>
        </section>

        {/* CTA */}
        <section className="cta-section" id="start">
          <div className="cta-panel">
            <h2>Siap Memetakan Masa Depanmu?</h2>
            <p>Simpan journey request dan lanjutkan dari role-focused roadmap setelah flow autentikasi ditambahkan.</p>
            <div className="email-form">
              <input type="email" placeholder="Masukkan alamat email kamu" value={email} onChange={e => setEmail(e.target.value)}/>
              <button type="button" onClick={handleStartJourney}>Mulai Journey</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div><strong>SkillMap</strong><p>© 2026 SkillMap AI. Navigator pembelajaran keterampilan yang dipersonalisasi.</p></div>
        <nav aria-label="Footer navigation">
          <a href="#workspace">Upload CV</a>
          <a href="#workspace">Job Matches</a>
          <a href="#workspace">Quiz</a>
          <a href="#workspace">Learning Path</a>
        </nav>
      </footer>
    </div>
  );
}

export default App;
