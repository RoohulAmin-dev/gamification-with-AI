import React, { useState, useMemo } from 'react';
import useProgress from '../../hooks/useProgress';

const LessonLayout = ({ title, decision = {}, children, miniChallenge = null }) => {
  const [completed, setCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lessonMessage, setLessonMessage] = useState('Complete the activity to unlock lesson progress.');
  const [isReadyToComplete, setIsReadyToComplete] = useState(false);
  const { state: progressState, addXP, completeLesson: markLessonComplete } = useProgress();

  const handleComplete = () => {
    if (!completed) {
      addXP(10);
      markLessonComplete();
      setCompleted(true);
      setProgressPercent(100);
      setLessonMessage('You earned +10 XP!');
      setIsReadyToComplete(true);
    }
  };

  const handleReset = () => {
    setCompleted(false);
    setProgressPercent(0);
    setIsReadyToComplete(false);
    setLessonMessage('Complete the activity to unlock lesson progress.');
  };

  const handleChildProgress = (value) => {
    const percent = Math.max(0, Math.min(100, value || 0));
    setProgressPercent(percent);
    if (!completed) {
      const ready = percent >= 100;
      setIsReadyToComplete(ready);
      setLessonMessage(ready ? 'Ready to complete the lesson.' : 'Keep going to progress the lesson.');
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
  }, [children, handleChildProgress, handleChildComplete]);

    return (
    <div className="lesson-layout">
      {/* Lesson header */}
      <header className="lesson-header">
        <div style={{ flex: 1 }}>
          <h2 className="hero-title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: '8px' }}>{title || 'Lesson'}</h2>
          {decision?.reason && <div className="muted" style={{ fontSize: '1.1rem' }}>{decision.reason}</div>}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="badge" style={{ background: 'var(--text-strong)', color: 'white' }}>{decision?.estimated_time || '15 min'}</div>
          <div className="badge">XP: {progressState.xp}</div>
        </div>
      </header>

      <div className="lesson-summary">
        <div className="lesson-progress-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="muted">Lesson Progress</span>
          <span className="text-strong" style={{ fontWeight: 700 }}>{progressPercent}%</span>
        </div>
        <div className="lesson-progress-bar">
          <div className="lesson-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div style={{ marginTop: '16px' }}>
          <div className="lesson-status-tag">{lessonMessage}</div>
        </div>
      </div>

      {/* AI Decision card */}
      <div className="card card--padded">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
              Strategy: {decision?.learning_type || 'Custom'}
            </div>
            <div className="card-title" style={{ margin: 0 }}>{decision?.title || 'AI Strategy'}</div>
            <p className="muted" style={{ marginTop: '8px', marginBottom: 0 }}>{decision?.summary || decision?.reason || ''}</p>
          </div>
        </div>
      </div>

      {/* Interactive learning component slot */}
      <div className="lesson-content">
        {childWithControls}
      </div>

      {/* Mini challenge */}
      <div className="mini-challenge">
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 700, marginBottom: '12px' }}>
          Apply your knowledge
        </div>
        <h4 className="card-title" style={{ marginTop: 0 }}>Mini Challenge</h4>
        {miniChallenge ? (
    <div>

        <h4>{miniChallenge.question}</h4>

        {miniChallenge.options?.map((option,index)=>(
            <button
                key={index}
                className="chip"
                style={{
                    display:"block",
                    width:"100%",
                    marginBottom:"10px",
                    textAlign:"left"
                }}
            >
                {option}
            </button>
        ))}

        <p style={{marginTop:"15px"}}>
            <strong>Answer:</strong> {miniChallenge.answer}
        </p>

        <p>
            {miniChallenge.explanation}
        </p>

    </div>
) : (
          <div className="muted">No mini challenge provided for this lesson.</div>
        )}
      </div>

      {/* Completion screen */}
      <div className="completion-screen">
        {!completed ? (
          <div className="card card--padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.02)', borderStyle: 'dashed' }}>
            <div className="muted" style={{ fontSize: '1rem' }}>
              {isReadyToComplete ? 'Great job! You have finished the activity.' : 'Complete the interactive activity above to finish the lesson.'}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn--primary" onClick={handleComplete} disabled={!isReadyToComplete}>Mark Lesson as Complete</button>
              <button className="btn" onClick={handleReset}>Restart Activity</button>
            </div>
          </div>
        ) : (
          <div className="card card--padded" style={{ background: 'var(--text-strong)', color: 'white', borderRadius: '32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h3 className="card-title" style={{ color: 'white', fontSize: '2rem', marginBottom: '8px' }}>Lesson Completed!</h3>
            <p style={{ opacity: 0.8, fontSize: '1.1rem', marginBottom: '24px' }}>You've successfully mastered this topic and earned +10 XP.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn" style={{ background: 'white', color: 'var(--text-strong)', border: 'none' }} onClick={handleReset}>Restart Lesson</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonLayout;
