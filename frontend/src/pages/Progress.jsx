import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useProgress from '../hooks/useProgress';
import { getLearningHistory } from '../services/historyService';
import { getTotalStudyTimeSeconds } from '../utils/progress';

const formatStudyTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
};

const XP_MILESTONE = 200;

const Progress = () => {
  const { user } = useAuth();
  const { state } = useProgress();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setHistoryLoading(false);
        return;
      }

      try {
        const { data, error } = await getLearningHistory(user.id);
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        setHistoryError(err.message || 'Failed to load history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const studyTime = useMemo(() => getTotalStudyTimeSeconds(), []);

  const streakValue = typeof state.streak === 'object' && state.streak !== null
    ? state.streak.current
    : Number(state.streak || 0);

  const xp = Number(state.xp || 0);
  const lessonsCompleted = Number(state.completedLessons || 0);
  const xpProgress = Math.min(xp / XP_MILESTONE, 1);

  const insights = useMemo(() => {
    if (!history.length) return null;

    const modeCounts = {};
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let lessonsThisWeek = 0;

    history.forEach((item) => {
      const mode = item.learning_type || 'General';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;

      const createdAt = new Date(item.created_at);
      if (createdAt >= weekAgo) {
        lessonsThisWeek += 1;
      }
    });

    const sortedModes = Object.entries(modeCounts).sort((a, b) => b[1] - a[1]);
    const mostUsedMode = sortedModes[0]?.[0] || null;

    return {
      mostUsedMode,
      mostRecentTopic: history[0]?.title || history[0]?.prompt || 'No topics yet',
      lessonsThisWeek,
      totalLessons: history.length,
    };
  }, [history]);

  const recentItems = history.slice(0, 5);

  return (
    <div className="page-container progress-dashboard">
      <header className="progress-header">
        <h1>Your Learning Progress</h1>
        <p className="page-subtitle">Track your learning activity, progress, and achievements.</p>
      </header>

      <div className="progress-stats">
        <div className="stat-card xp-card">
          <div className="stat-icon xp-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">{xp}</span>
            <span className="stat-label">Current XP</span>
            <span className="stat-context">{xp} / {XP_MILESTONE} XP</span>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <span className="stat-value">{lessonsCompleted}</span>
            <span className="stat-label">Lessons Completed</span>
            <span className="stat-context">Interactive lessons completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-value">{streakValue}</span>
            <span className="stat-label">Current Streak</span>
            <span className="stat-context">
              {streakValue > 0 ? `${streakValue} day${streakValue !== 1 ? 's' : ''}` : 'Start your learning streak today.'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <span className="stat-value">{formatStudyTime(studyTime)}</span>
            <span className="stat-label">Study Time</span>
            <span className="stat-context">Total time spent learning</span>
          </div>
        </div>
      </div>

      <div className="progress-body">
        <section className="progress-section recent-section">
          <h2 className="section-title">Recent Learning Activity</h2>

          {historyError && (
            <div className="history-error">
              <p>Unable to load recent activity.</p>
              <button type="button" className="btn btn--ghost" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {!historyError && historyLoading && (
            <div className="history-loading">
              <p>Loading your recent activity...</p>
            </div>
          )}

          {!historyError && !historyLoading && !recentItems.length && (
            <div className="progress-empty-state">
              <div className="empty-icon">🚀</div>
              <h3>Your learning journey starts here.</h3>
              <p>Generate your first interactive lesson and your activity will appear here.</p>
              <button type="button" className="btn btn--primary start-btn" onClick={() => navigate('/')}>
                Start Learning
              </button>
            </div>
          )}

          {!historyError && !historyLoading && recentItems.length > 0 && (
            <div className="recent-list">
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="recent-item"
                  onClick={() => navigate('/', { state: { lesson: item } })}
                >
                  <div className="recent-main">
                    <h4>{item.title || item.prompt}</h4>
                    <div className="recent-meta">
                      <span className="recent-badge">{item.learning_type || 'Lesson'}</span>
                      <span className="recent-dot">•</span>
                      <span className="recent-difficulty">{item.difficulty || 'Beginner'}</span>
                    </div>
                  </div>
                  <div className="recent-right">
                    <time className="recent-date">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                    <span className="recent-arrow">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="progress-section summary-section">
          <h2 className="section-title">Learning Summary</h2>

          {!insights ? (
            <div className="summary-empty">
              <p>Complete a few lessons to see your learning insights here.</p>
            </div>
          ) : (
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Most Used Mode</span>
                <span className="summary-value">{insights.mostUsedMode || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Most Recent Topic</span>
                <span className="summary-value">{insights.mostRecentTopic}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Lessons This Week</span>
                <span className="summary-value">{insights.lessonsThisWeek}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Lessons</span>
                <span className="summary-value">{insights.totalLessons}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Progress;
