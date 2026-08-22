import React, { useState, useMemo } from 'react';
import useProgress from '../../hooks/useProgress';

const MiniChallengeInteractive = ({ miniChallenge }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index) => {
    if (submitted) return;
    setSelected(index);
    setSubmitted(true);
  };

  const normalize = (s) => (s || '').toString().trim().toLowerCase();
  const selectedText = miniChallenge.options?.[selected];
  const isCorrect =
    submitted &&
    normalize(selectedText) === normalize(miniChallenge.answer);

  return (
    <div>
      <h4>{miniChallenge.question}</h4>

      {miniChallenge.options?.map((option, index) => (
        <button
          key={index}
          className="chip"
          onClick={() => handleSelect(index)}
          disabled={submitted}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            textAlign: 'left',
            cursor: submitted ? 'default' : 'pointer',
            opacity: submitted && selected !== index ? 0.7 : 1,
          }}
        >
          {option}
        </button>
      ))}

      {submitted && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: '8px',
              color: isCorrect ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {isCorrect ? 'Correct ✅' : 'Incorrect ✖'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>Explanation:</strong>
            <div>{miniChallenge.explanation}</div>
          </div>

          {!isCorrect && (
            <div style={{ marginTop: '6px' }}>
              <strong>Answer:</strong> {miniChallenge.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LessonLayout = ({
  title,
  decision = {},
  children,
  miniChallenge = null,
}) => {
  const [completed, setCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lessonMessage, setLessonMessage] = useState(
    'Complete the activity to unlock lesson progress.'
  );
  const [isReadyToComplete, setIsReadyToComplete] = useState(false);

  const {
    state: progressState,
    addXP,
    completeLesson: markLessonComplete,
  } = useProgress();

  const handleComplete = async () => {
    if (completed) return;

    try {
      // Complete the lesson and update the progress state.
      const updatedProgress = markLessonComplete();

      // Add the XP reward separately.
      // The progress hook synchronizes both changes with Supabase.
      const finalProgress = addXP(10);

      setCompleted(true);
      setProgressPercent(100);
      setLessonMessage('You earned +10 XP!');
      setIsReadyToComplete(true);

      console.log('Lesson completed:', {
        updatedProgress,
        finalProgress,
      });
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

          <div className="badge">
            XP: {progressState.xp}
          </div>
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
          <MiniChallengeInteractive miniChallenge={miniChallenge} />
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
    </div>
  );
};

export default LessonLayout;
