import React, { useState, useMemo, useEffect, useRef } from 'react';
import useProgress from '../../hooks/useProgress';

const MiniChallengeInteractive = ({ miniChallenge, onChallengeComplete }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index) => {
    if (submitted) return;
    setSelected(index);
    setSubmitted(true);
    onChallengeComplete?.();
  };

  const normalize = (s) => (s || '').toString().trim().toLowerCase();
  const selectedText = miniChallenge.options?.[selected];
  const isCorrect =
    submitted &&
    selected !== null &&
    normalize(selectedText) === normalize(miniChallenge.answer);

  const correctIndex = miniChallenge.options?.findIndex(
    (opt) => normalize(opt) === normalize(miniChallenge.answer)
  );

  const getOptionClass = (index) => {
    if (!submitted) return 'option-button';
    if (index === correctIndex) return 'option-button correct';
    if (index === selected && !isCorrect) return 'option-button incorrect';
    return 'option-button';
  };

  return (
    <div>
      <h4>{miniChallenge.question}</h4>

      {miniChallenge.options?.map((option, index) => (
        <button
          key={index}
          type="button"
          className={getOptionClass(index)}
          onClick={() => handleSelect(index)}
          disabled={submitted}
        >
          {option}
        </button>
      ))}

      {submitted && (
        <div style={{ marginTop: '16px', padding: '18px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {isCorrect ? (
              <>
                <span style={{ fontSize: '1.5rem' }}>🎉</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>Correct!</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>Good try!</span>
              </>
            )}
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '0.95rem', color: 'var(--text)' }}>
            {miniChallenge.explanation}
          </p>

          {!isCorrect && (
            <div style={{ fontSize: '0.9rem', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <strong style={{ color: 'var(--success)' }}>Correct answer:</strong> {miniChallenge.answer}
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary"
            style={{ marginTop: '16px', width: '100%' }}
            onClick={() => onChallengeComplete?.()}
          >
            GOT IT
          </button>
        </div>
      )}
    </div>
  );
};

const getDifficultyColor = (difficulty) => {
  const level = (difficulty || '').toString().trim().toLowerCase();
  switch (level) {
    case 'beginner': return 'rgba(34, 197, 94, 0.7)';
    case 'intermediate': return 'rgba(245, 158, 11, 0.7)';
    case 'advanced': return 'rgba(239, 68, 68, 0.7)';
    default: return 'rgba(99, 102, 241, 0.7)';
  }
};

const LessonLayout = ({
  title,
  decision = {},
  children,
  miniChallenge = null,
  nextTopic = null,
  relatedTopics = [],
  onExplore = null,
}) => {
  const [completed, setCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lessonMessage, setLessonMessage] = useState(
    'Complete the activity to unlock lesson progress.'
  );
  const [isReadyToComplete, setIsReadyToComplete] = useState(false);
  const [floatingXP, setFloatingXP] = useState(null);

  const {
    state: progressState,
    addXP,
    addStudyTime,
    completeLesson: markLessonComplete,
  } = useProgress();

  const streakValue = typeof progressState.streak === 'object' && progressState.streak !== null
    ? Number(progressState.streak.current || 0)
    : Number(progressState.streak || 0);

  // Study time tracking
  const startTimeRef = useRef(null);
  const [studySeconds, setStudySeconds] = useState(0);

  // XP animation
  const [displayedXP, setDisplayedXP] = useState(() => Number(progressState.xp || 0));
  const xpRef = useRef(Number(progressState.xp || 0));

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsed >= 5) {
          addStudyTime(elapsed);
        }
      }
    };
  }, []);

  useEffect(() => {
    const target = Number(progressState.xp || 0);
    const start = xpRef.current;
    if (target === start) return;

    const duration = 800;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(start + (target - start) * progress);
      xpRef.current = value;
      setDisplayedXP(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayedXP(target);
        xpRef.current = target;
      }
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [progressState.xp]);

  const handleComplete = async () => {
    if (completed) return;

    try {
      // Complete the lesson and update the progress state.
      markLessonComplete();

       // Add the XP reward separately.
      // The progress hook synchronizes both changes with Supabase.
      addXP(10);

      // Trigger floating XP badge
      setFloatingXP({ id: Date.now(), amount: 10 });
      setTimeout(() => setFloatingXP(null), 1500);

      // Record study time for this lesson
      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      if (elapsed >= 3) {
        addStudyTime(elapsed);
        setStudySeconds(elapsed);
      }

       setCompleted(true);
      setProgressPercent(100);
      setLessonMessage('You earned +10 XP!');
      setIsReadyToComplete(true);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      setLessonMessage('Unable to save progress. Please try again.');
    }
  };

  const handleReset = () => {
    setCompleted(false);
    setProgressPercent(0);
    setIsReadyToComplete(false);
    setLessonMessage(
      'Complete the activity to unlock lesson progress.'
    );
  };

  const handleChildProgress = (value) => {
    const percent = Math.max(0, Math.min(100, value || 0));

    setProgressPercent(percent);

    if (!completed) {
      const ready = percent >= 100;

      setIsReadyToComplete(ready);

      setLessonMessage(
        ready
          ? 'Ready to complete the lesson.'
          : 'Keep going to progress the lesson.'
      );
    }
  };

  const handleChildComplete = () => {
    handleComplete();
  };

  const handleChallengeComplete = () => {
    if (!completed) {
      setIsReadyToComplete(true);
      setLessonMessage('Mini-challenge complete. Ready to finish the lesson.');
    }
  };

  const childWithControls = useMemo(() => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        onProgress: handleChildProgress,
        onComplete: handleChildComplete,
      });
    }

    return children;
  }, [children]);

  return (
    <div className="lesson-layout">

      {/* Lesson header */}
      <header className="lesson-header">
        <div style={{ flex: 1 }}>
          <h2
            className="hero-title"
            style={{
              fontSize: '2.5rem',
              textAlign: 'left',
              marginBottom: '8px',
            }}
          >
            {title || 'Lesson'}
          </h2>

          {decision?.reason && (
            <div
              className="muted"
              style={{ fontSize: '1.1rem' }}
            >
              {decision.reason}
            </div>
          )}
        </div>

        <div
          style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            className="badge"
            style={{
              background: 'var(--text-strong)',
              color: 'white',
            }}
          >
            {decision?.estimated_time || '15 min'}
          </div>

          {decision?.difficulty && (
            <div
              className="badge"
              style={{
                background: getDifficultyColor(decision.difficulty),
                color: 'white',
                fontSize: '0.82rem',
                padding: '4px 12px',
              }}
            >
              {decision.difficulty}
            </div>
          )}

          <div className="badge">
            XP: {displayedXP}
          </div>

          {floatingXP && (
            <span
              key={floatingXP.id}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-32px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#f59e0b',
                animation: 'xpFloat 1.2s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              +{floatingXP.amount}
            </span>
          )}
        </div>
      </header>

      {/* Lesson progress */}
      <div className="lesson-summary">
        <div
          className="lesson-progress-meta"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span className="muted">Lesson Progress</span>

          <span
            className="text-strong"
            style={{ fontWeight: 700 }}
          >
            {progressPercent}%
          </span>
        </div>

        <div className="lesson-progress-bar">
          <div
            className="lesson-progress-fill"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <div className="lesson-status-tag">
            {lessonMessage}
          </div>
        </div>
      </div>

      {/* AI Decision card */}
      <div className="card card--padded">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent)',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              Strategy: {decision?.learning_type || 'Custom'}
            </div>

            <div
              className="card-title"
              style={{ margin: 0 }}
            >
              {decision?.title || 'AI Strategy'}
            </div>

            <p
              className="muted"
              style={{
                marginTop: '8px',
                marginBottom: 0,
              }}
            >
              {decision?.summary ||
                decision?.reason ||
                ''}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive learning component */}
      <div className="lesson-content">
        {childWithControls}
      </div>

      {/* Mini challenge */}
      <div className="mini-challenge">
        <div
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent)',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          Apply your knowledge
        </div>

        <h4
          className="card-title"
          style={{ marginTop: 0 }}
        >
          Mini Challenge
        </h4>

        {miniChallenge ? (
          <MiniChallengeInteractive
            miniChallenge={miniChallenge}
            onChallengeComplete={handleChallengeComplete}
          />
        ) : (
          <p className="muted">No challenge available for this lesson.</p>
        )}
      </div>

      {/* Lesson actions navigation footer */}
      <footer
        className="lesson-footer-actions"
        style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          className="btn btn--secondary"
          onClick={handleReset}
          disabled={!completed && progressPercent === 0}
        >
          Reset Activity
        </button>

        <button
          className="btn btn--primary"
          onClick={handleComplete}
          disabled={!isReadyToComplete || completed}
          style={{
            background: completed ? 'var(--success)' : undefined,
            borderColor: completed ? 'var(--success)' : undefined,
          }}
        >
          {completed ? 'Lesson Completed ✓' : 'Mark Lesson as Complete'}
        </button>
      </footer>

      {/* Lesson completion results */}
      {completed && (
        <div
          className="completion-results"
          style={{
            marginTop: '24px',
            padding: '24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.96))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            animation: 'celebrationPop 0.5s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '2rem' }}>🎉</div>
            <h3 style={{ margin: 0, color: 'var(--text-strong)' }}>Lesson Complete!</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>+10</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>XP Earned</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-strong)' }}>
                {studySeconds >= 60
                  ? `${Math.floor(studySeconds / 60)}m ${studySeconds % 60}s`
                  : `${studySeconds}s`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Study Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                {streakValue}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Day Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Progressive learning path */}
      {completed && (nextTopic || (Array.isArray(relatedTopics) && relatedTopics.length > 0)) && (
        <div
          className="learning-path-section"
          style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <h3 className="card-title" style={{ marginTop: 0, marginBottom: '16px' }}>
            Next Steps
          </h3>

          {nextTopic && (
            <div style={{ marginBottom: '20px' }}>
              <div
                className="muted"
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                }}
              >
                Continue Learning
              </div>
              <button
                className="btn btn--primary"
                onClick={() => onExplore && onExplore(nextTopic)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                }}
              >
                <strong>{nextTopic}</strong>
                <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  Continue your learning journey
                </div>
              </button>
            </div>
          )}

          {Array.isArray(relatedTopics) && relatedTopics.length > 0 && (
            <div>
              <div
                className="muted"
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                }}
              >
                Related Topics
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {relatedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    className="btn btn--ghost"
                    onClick={() => onExplore && onExplore(topic)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 14px',
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonLayout;
