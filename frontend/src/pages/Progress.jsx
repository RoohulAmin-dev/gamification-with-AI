import { useMemo } from 'react';
import useProgress from '../hooks/useProgress';
import { getTotalStudyTimeSeconds } from '../utils/progress';

const formatStudyTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
};

const Progress = () => {
  const { state } = useProgress();
  const studyTime = useMemo(() => getTotalStudyTimeSeconds(), []);

  const streakValue = typeof state.streak === 'object' && state.streak !== null
    ? state.streak.current
    : Number(state.streak || 0);

  return (
    <div className="page-container">
      <section className="progress-page">
        <h1>Your Progress</h1>
        <p className="page-subtitle">Track your learning growth and streaks.</p>

        <div className="progress-grid">
          <div className="progress-card">
            <span className="progress-value">{state.xp ?? 0}</span>
            <span className="progress-label">XP Earned</span>
          </div>

          <div className="progress-card">
            <span className="progress-value">{state.completedLessons ?? 0}</span>
            <span className="progress-label">Lessons Completed</span>
          </div>

          <div className="progress-card">
            <span className="progress-value">{streakValue}</span>
            <span className="progress-label">Day Streak</span>
          </div>

          <div className="progress-card">
            <span className="progress-value">{formatStudyTime(studyTime)}</span>
            <span className="progress-label">Study Time</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Progress;
