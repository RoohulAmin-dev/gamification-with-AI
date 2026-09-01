import { useAuth } from "../context/AuthContext";
import { saveLearningHistory } from "../services/historyService";
import { getLearningHistory } from "../services/historyService";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { generateContent } from '../services/api';
import { NavLink } from 'react-router-dom';
import Diagram from '../components/Diagram/Diagram';
import Timeline from '../components/Timeline/Timeline';
import Flashcards from '../components/Flashcards/Flashcards';
import Quiz from '../components/Quiz/Quiz';
import Visualization from '../components/Visualization/Visualization';
import Simulation from '../components/Simulation/Simulation';
import LessonLayout from '../components/LessonLayout/LessonLayout';

const componentMap = {
  flashcards: Flashcards,
  timeline: Timeline,
  diagram: Diagram,
  quiz: Quiz,
  simulation: Simulation,
  visualization: Visualization,
};

const exampleTopics = ['React Hooks', 'TCP/IP', 'CPU Scheduling', 'SQL Basics', 'Machine Learning'];

const UnknownTypeFallback = ({ learningType }) => (
  <div className="glass-card">
    <h4 className="card-title">Unsupported learning type</h4>
    <p>{learningType ? `The server returned "${learningType}" which is not supported yet.` : 'The server returned an unknown learning type.'}</p>
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState('beginner');
  const [promptHistory, setPromptHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const lesson = location.state?.lesson;
    if (lesson?.lesson_data) {
      setResult({
        success: true,
        data: lesson.lesson_data,
      });
      setPrompt(lesson.prompt || '');
      window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
    }
  }, [location.state?.lesson]);

  useEffect(() => {
    const raw = localStorage.getItem('prompt_history');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPromptHistory(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const loadRecent = async () => {
      if (!user?.id) {
        setHistoryLoading(false);
        return;
      }

      const { data } = await getLearningHistory(user.id);
      setRecentHistory((data || []).slice(0, 3));
      setHistoryLoading(false);
    };

    loadRecent();
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await generateContent(prompt.trim(), level);
      setResult(data);

      if (user?.id) {
        await saveLearningHistory({
          userId: user.id,
          prompt: prompt.trim(),
          result: data,
        });
      }

      try {
        const updated = [prompt.trim(), ...promptHistory.filter(p => p !== prompt.trim())].slice(0, 4);
        setPromptHistory(updated);
        localStorage.setItem('prompt_history', JSON.stringify(updated));
      } catch {
        // ignore
      }

      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    handleGenerate();
  };

  const learningType = result?.data?.learning_type || result?.learning_type;
  const RenderedComponent = learningType ? componentMap[learningType] : null;

  return (
    <div className="glass-shell">
      <section className="home-hero">
        <h1 className="hero-title">What do you want to master today?</h1>
        <p className="hero-copy">
          {user?.email ? 'Welcome back. ' : ''}Our AI converts any topic into a personalized interactive lesson, tailored to how you learn best.
        </p>
      </section>

      <section className="generator-card">
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
        </div>
      </section>

      <section className="quick-start">
        <div className="topic-chips">
          {(promptHistory.length ? promptHistory : exampleTopics).map((topic) => (
            <button key={topic} type="button" className="chip" onClick={() => setPrompt(topic)}>
              {topic}
            </button>
          ))}
        </div>
      </section>

      {!historyLoading && recentHistory.length > 0 && (
        <section className="recent-activity">
          <div className="recent-header">
            <h2>Recent Activity</h2>
            <NavLink to="/history" className="recent-link">View all history</NavLink>
          </div>
          <div className="recent-list">
            {recentHistory.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                className="recent-item"
                onClick={() => {
                  setResult({
                    success: true,
                    data: lesson.lesson_data,
                  });
                  setPrompt(lesson.prompt || '');
                  window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
                }}
              >
                <div>
                  <h4>{lesson.title || lesson.prompt}</h4>
                  <p>{lesson.learning_type || 'Lesson'} • {lesson.difficulty || 'Beginner'}</p>
                </div>
                <span className="recent-arrow">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!result && !loading && (
        <div className="home-empty-state">
          <p>Start with any topic. Your AI tutor will choose an interactive format based on what helps you learn best.</p>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-shell">
            <div className="thinking-top" style={{ marginBottom: '32px' }}>
              <div className="spinner" />
              <div>
                <strong>Building your interactive lesson...</strong>
                <p className="loading-status-copy">Combining cognitive science with AI to build the best experience.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-card">
          <h4 className="card-title">Couldn't generate a lesson</h4>
          <p className="muted">{error}</p>
          <p className="muted" style={{ marginTop: '8px', fontSize: '0.9rem' }}>
            The AI models encountered an issue. Try rephrasing your topic or check your OpenRouter API key.
          </p>
          <button type="button" className="btn btn--primary" onClick={handleRetry} style={{ marginTop: '12px' }}>
            Retry with Secondary Model
          </button>
        </div>
      )}

      {result && (
        <div style={{ animation: 'textFade 0.6s ease-out' }}>
          <LessonLayout
            title={result?.data?.title || result?.title}
            decision={result?.data || {}}
            miniChallenge={result?.data?.content?.mini_challenge}
            nextTopic={result?.data?.nextTopic}
            relatedTopics={result?.data?.relatedTopics}
            onExplore={(topic) => {
              setResult(null);
              setPrompt(topic);
              setTimeout(() => handleGenerate(), 100);
            }}
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
