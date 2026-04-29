import { useEffect, useMemo, useState } from 'react';
import { fetchDashboard, fetchQuizQuestions, submitQuiz, uploadCv } from './api';

const initialAnalysis = {
  extractedSkills: ['JavaScript', 'React'],
  skillGap: ['Node.js', 'System Design'],
  recommendation: [
    'Build one end-to-end project',
    'Learn relational database basics',
    'Deploy the project to Vercel or Netlify'
  ],
  confidence: 0.72
};

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [quizResult, setQuizResult] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Upload a CV to start the analysis flow.');
  const [domain, setDomain] = useState('technology');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardResponse, quizResponse] = await Promise.all([
          fetchDashboard(),
          fetchQuizQuestions(domain)
        ]);

        setDashboard(dashboardResponse.data);
        setQuestions(quizResponse.data.questions || []);
      } catch (error) {
        setStatusMessage(error.message || 'Failed to load data from API.');
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    load();
  }, [domain]);

  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setStatusMessage('Analyzing CV through the REST API...');

    try {
      setIsUploading(true);
      const response = await uploadCv(file, domain);
      setAnalysis(response.data);
      setStatusMessage(`Analysis complete for ${response.data.fileName}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: optionIndex
    }));
  };

  const handleQuizSubmit = async () => {
    try {
      const answers = questions.map((question) => selectedAnswers[question.id] ?? null);
      const response = await submitQuiz(answers, domain);
      setQuizResult(response.data);
      setStatusMessage('Quiz submitted successfully.');
    } catch (error) {
      setStatusMessage(error.message || 'Quiz submission failed.');
    }
  };

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">SkillMap</span>
          <h1>CV analysis, skill gap detection, and learning roadmap in one responsive dashboard.</h1>
          <p>
            This starter uses Vite, React, Axios, Express, and a mock AI layer so the core flow works
            end-to-end without crashing.
          </p>

          <div className="hero-actions">
            <label className="primary-button" htmlFor="cv-upload">
              Upload CV
            </label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} style={{ marginLeft: 8, borderRadius: 10, padding: '8px 10px' }}>
              <option value="technology">Technology</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
            </select>
            <a className="secondary-button" href="#quiz">
              Take Quiz
            </a>
          </div>

          <p className="status-line">{statusMessage}</p>
        </div>

        <aside className="mockup-card">
          <div className="mockup-header">
            <span>Analysis Preview</span>
            <span className="pill">AI + API</span>
          </div>
          <div className="mockup-metric">
            <strong>{Math.round((analysis.confidence || 0) * 100)}%</strong>
            <span>confidence</span>
          </div>
          <div className="mockup-grid">
            <div>
              <small>Strengths</small>
              <p>{analysis.extractedSkills.join(', ')}</p>
            </div>
            <div>
              <small>Gap</small>
              <p>{analysis.skillGap.join(', ')}</p>
            </div>
          </div>
        </aside>
      </header>

      <main className="content-grid">
        <section className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <span className="section-tag">01</span>
              <h2>Upload CV</h2>
            </div>
            <p>REST call to <code>/api/cv/upload</code> with multipart data.</p>
          </div>

          <input id="cv-upload" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} />
          <button className="primary-button full-width" type="button" disabled={isUploading} onClick={() => document.getElementById('cv-upload')?.click()}>
            {isUploading ? 'Processing...' : 'Choose file and analyze'}
          </button>

          <div className="analysis-card">
            <h3>Extracted Skills</h3>
            <div className="chip-row">
              {analysis.extractedSkills.map((skill) => (
                <span className="chip" key={skill}>{skill}</span>
              ))}
            </div>

            <h3>Skill Gap</h3>
            <div className="chip-row muted">
              {analysis.skillGap.map((gap) => (
                <span className="chip ghost" key={gap}>{gap}</span>
              ))}
            </div>

            <h3>Learning Path</h3>
            <ol className="roadmap-list">
              {analysis.recommendation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="section-tag">02</span>
              <h2>Dashboard</h2>
            </div>
            <p>Fetched from Express via Axios.</p>
          </div>

          {isLoadingDashboard ? (
            <div className="loading-state">Loading dashboard data...</div>
          ) : (
            <>
              <div className="dashboard-header">
                <div>
                  <small>Welcome</small>
                  <h3>{dashboard?.user?.name}</h3>
                </div>
                <div className="score-badge">{dashboard?.skillScore ?? 0}/100</div>
              </div>

              <div className="stats-grid">
                <article>
                  <small>Target Role</small>
                  <strong>{dashboard?.targetRole}</strong>
                </article>
                <article>
                  <small>Strengths</small>
                  <strong>{dashboard?.strengths.join(', ')}</strong>
                </article>
                <article>
                  <small>Gaps</small>
                  <strong>{dashboard?.gaps.join(', ')}</strong>
                </article>
              </div>
            </>
          )}
        </section>

        <section id="quiz" className="panel quiz-panel">
          <div className="panel-heading">
            <div>
              <span className="section-tag">03</span>
              <h2>Adaptive Quiz</h2>
            </div>
            <p>{answeredCount} of {questions.length} answered</p>
          </div>

          <div className="quiz-list">
            {questions.map((question) => (
              <article className="quiz-item" key={question.id}>
                <h3>{question.prompt}</h3>
                <div className="option-grid">
                  {question.options.map((option, index) => {
                    const isActive = selectedAnswers[question.id] === index;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`option-button ${isActive ? 'active' : ''}`}
                        onClick={() => handleAnswerSelect(question.id, index)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <button className="primary-button full-width" type="button" onClick={handleQuizSubmit}>
            Submit Quiz
          </button>

          {quizResult && (
            <div className="quiz-result">
              <strong>Score: {quizResult.score}</strong>
              <p>Track: {quizResult.track}</p>
              <ul>
                {quizResult.roadmap.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
