import { useEffect, useState } from 'react';
import { generateContent } from '../services/api';
import Diagram from '../components/Diagram/Diagram';
import Timeline from '../components/Timeline/Timeline';
import Flashcards from '../components/Flashcards/Flashcards';
import Quiz from '../components/Quiz/Quiz';
import Visualization from '../components/Visualization/Visualization';
import Simulation from '../components/Simulation/Simulation';
import LessonLayout from '../components/LessonLayout/LessonLayout';

const loadingSteps = [
  'Analyzing topic...',
  'Choosing best learning strategy...',
  'Building lesson...',
  'Preparing interactive experience...',
  'Almost ready...',
];

const componentMap = {
  flashcards: Flashcards,
  timeline: Timeline,
  diagram: Diagram,
  quiz: Quiz,
  simulation: Simulation,
  visualization: Visualization,
};

const exampleTopics = ['React Hooks', 'TCP/IP', 'CPU Scheduling', 'SQL Basics'];

const learningModes = [
  { key: 'flashcards', label: 'Flashcards', icon: '🧠', description: 'Memorize concepts through bite-sized cards.' },
  { key: 'quiz', label: 'Quiz', icon: '✅', description: 'Test understanding with rapid question rounds.' },
  { key: 'timeline', label: 'Timeline', icon: '🕒', description: 'See how ideas connect over time.' },
  { key: 'diagram', label: 'Diagram', icon: '🧩', description: 'Visualize systems and workflows clearly.' },
  { key: 'visualization', label: 'Visualization', icon: '📊', description: 'Explore concepts through rich visuals.' },
  { key: 'simulation', label: 'Simulation', icon: '⚙️', description: 'Practice skills in an interactive scenario.' },
];

const UnknownTypeFallback = ({ learningType }) => (
  <div className="glass-card">
    <h4 className="card-title">Unsupported learning type</h4>
    <p>{learningType ? `The server returned "${learningType}" which is not supported yet.` : 'The server returned an unknown learning type.'}</p>
  </div>
);

const Home = () => {
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState('beginner');
  const [mode, setMode] = useState('auto');
  const [showModes, setShowModes] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('prompt_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPromptHistory(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setLoadingStepIndex(0);
    setStatusMessage('Sending prompt to AI...');

    const finalPrompt = mode && mode !== 'auto' ? `FORCE_LEARNING_MODE:${mode}\n${prompt}` : prompt;
    let attempt = 0;
    const maxAttempts = 2;
    let lastError = null;
    let gotResult = false;

    while (attempt < maxAttempts) {
      try {
        if (attempt > 0) {
          setStatusMessage('Please wait, your request is being resent to AI...');
        }

        const data = await generateContent(finalPrompt, level);
        setResult(data);
        gotResult = true;
        setStatusMessage('');

        try {
          const normalized = prompt.trim();
          const updated = [normalized, ...promptHistory.filter(p => p !== normalized)].slice(0, 4);
          setPromptHistory(updated);
          localStorage.setItem('prompt_history', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }

        setTimeout(() => {
          window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
        }, 100);
        break;
      } catch (err) {
        lastError = err;
        const retryable = /AI response could not be parsed|invalid AI response|Unable to parse/i.test(err.message);
        if (!retryable) {
          break;
        }
        attempt += 1;
        if (attempt >= maxAttempts) break;
      }
    }

    if (!gotResult) {
      setError(lastError?.message || 'Something went wrong.');
    }
    setLoading(false);
    setStatusMessage('');
  };

  const learningType = result?.data?.learning_type || result?.learning_type;
  const RenderedComponent = learningType ? componentMap[learningType] : null;

  return (
    <div className="glass-shell">
      <section className="hero-panel">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <h1 className="hero-title">Master any topic with AI</h1>
          <p className="hero-copy">Enter a subject and our AI will craft a personalized, interactive lesson designed for deep understanding.</p>
        </div>

        <div className="input-group">
          <div className="input-body">
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want to learn today?"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            <div className="settings-row">
              <div className="input-meta-group">
                <span className="field-label">Difficulty</span>
                <select className="select-control" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button type="button" className="button-primary" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                {loading ? 'Designing Lesson...' : 'Generate Lesson'}
              </button>
            </div>
          </div>

          <aside className="learning-modes-panel">
            <div className="learning-modes-header">
              <div>
                <p className="field-label">Learning Modes</p>
                <h2 className="mode-panel-title">Choose the perfect format</h2>
                <p className="mode-panel-copy">Select one of six premium learning experiences for your lesson.</p>
              </div>
              <button type="button" className="btn btn--ghost mode-toggle" onClick={() => setShowModes((prev) => !prev)}>
                {showModes ? 'Hide' : 'Expand'}
              </button>
            </div>

            <div className={`mode-panel-body ${showModes ? 'expanded' : ''}`}>
              <div className="modes-grid">
                {learningModes.map(({ key, label, icon, description }) => (
                  <button
                    key={key}
                    type="button"
                    className={`mode-item ${mode === key ? 'selected' : ''}`}
                    onClick={() => setMode(key)}
                  >
                    <span className="mode-icon">{icon}</span>
                    <div>
                      <div className="mode-label">{label}</div>
                      <p className="mode-description">{description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mode-panel-footer">
                <p className="mode-note">
                  {mode === 'auto'
                    ? 'AI will choose the best learning experience if you generate without selecting one.'
                    : `Selected: ${learningModes.find((item) => item.key === mode)?.label}`}
                </p>
                <button type="button" className="btn btn--ghost mode-reset" onClick={() => setMode('auto')}>
                  Reset to Auto
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="topic-chips">
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginRight: '8px' }}>History:</span>
          {(promptHistory.length ? promptHistory : exampleTopics).map((topic) => (
            <button key={topic} type="button" className="chip" onClick={() => setPrompt(topic)}>
              {topic}
            </button>
          ))}
        </div>

        {error && <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>}
      </section>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-shell">
            <div className="thinking-top" style={{ marginBottom: '32px' }}>
              <div className="spinner" />
              <div>
                <strong>Architecting your lesson</strong>
                <p className="loading-status-copy">Combining cognitive science with AI to build the best experience.</p>
                {statusMessage && <p className="loading-status-copy" style={{ marginTop: '8px' }}>{statusMessage}</p>}
              </div>
            </div>

            <div className="loading-stage-list">
              {loadingSteps.map((step, index) => (
                <div key={step} className={`stage-item ${index === loadingStepIndex ? 'active' : ''} ${index < loadingStepIndex ? 'completed' : ''}`}>
                  <div className="stage-bullet">
                    {index < loadingStepIndex ? '✓' : index + 1}
                  </div>
                  <div className="stage-text">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div style={{ animation: 'textFade 0.6s ease-out' }}>
          <LessonLayout 
            title={result?.data?.title || result?.title} 
            decision={result?.data || {}} 
            miniChallenge={result?.data?.content?.mini_challenge}
          >
            {RenderedComponent ? (
              <RenderedComponent response={result} />
            ) : (
              <UnknownTypeFallback learningType={learningType} />
            )}
          </LessonLayout>
        </div>
      )}
    </div>
  );
};

export default Home;
