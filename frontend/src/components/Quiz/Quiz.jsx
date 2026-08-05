import { useEffect, useState } from 'react';

const Quiz = ({ response, onProgress, onComplete }) => {
  const data = response?.data || response || {};
  const title = data.title || 'Quiz';
  const content = data.content || {};
  const questions = Array.isArray(content.questions) ? content.questions : [];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    const answeredCount = finished ? questions.length : current;
    const percent = questions.length ? Math.round(((answeredCount + (hasAnswered ? 1 : 0)) / questions.length) * 100) : 0;
    if (typeof onProgress === 'function') onProgress(percent);
  }, [current, finished, hasAnswered, questions.length, onProgress]);

  if (questions.length === 0) {
    return (
      <div className="card card--padded empty-state" style={{ maxWidth: 600 }}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p>No quiz questions available yet. Try another topic or regenerate the lesson.</p>
      </div>
    );
  }

  const q = questions[current];

  const handleSelect = (option) => {
    if (hasAnswered) return;
    setSelected(option);
    const correct = (q.answer || '').toString().toLowerCase() === option.toString().toLowerCase();
    if (correct) setScore((s) => s + 1);
    setHasAnswered(true);
  };

  const goNext = () => {
    if (!hasAnswered) return;
    setSelected(null);
    setHasAnswered(false);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
      if (typeof onComplete === 'function') onComplete();
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

    return (
    <div className="card card--padded" style={{ maxWidth: 700, margin: '0 auto', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">{finished ? `Score: ${score}/${questions.length}` : `Question ${current + 1} / ${questions.length}`}</div>
      </div>

      {!finished ? (
        <div style={{ animation: 'textFade 0.4s ease' }}>
          <div style={{ marginBottom: 'var(--space-md)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.4 }}>{q.question}</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
              const isSelected = selected === opt;
              const isCorrect = (q.answer || '').toString().toLowerCase() === opt.toString().toLowerCase();
              
              let borderStyle = '1px solid var(--border)';
              let bgColor = 'white';
              let color = 'var(--text)';

              if (hasAnswered) {
                if (isCorrect) {
                  borderStyle = '2px solid var(--success)';
                  bgColor = 'rgba(16, 185, 129, 0.05)';
                  color = 'var(--success)';
                } else if (isSelected) {
                  borderStyle = '2px solid var(--danger)';
                  bgColor = 'rgba(239, 68, 68, 0.05)';
                  color = 'var(--danger)';
                }
              } else if (isSelected) {
                borderStyle = '2px solid var(--text-strong)';
                bgColor = '#f8fafc';
              }

              return (
                <button 
                  key={i} 
                  onClick={() => handleSelect(opt)} 
                  className="btn" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    textAlign: 'left', 
                    border: borderStyle,
                    background: bgColor,
                    color: color,
                    fontSize: '1rem',
                    fontWeight: isSelected ? 600 : 400
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </div>
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="mini-challenge" style={{ marginTop: '24px', background: (selected.toString().toLowerCase() === (q.answer || '').toString().toLowerCase()) ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: 'none' }}>
              <div style={{ fontWeight: 700, color: (selected.toString().toLowerCase() === (q.answer || '').toString().toLowerCase()) ? 'var(--success)' : 'var(--danger)', marginBottom: '8px' }}>
                {selected.toString().toLowerCase() === (q.answer || '').toString().toLowerCase() ? '✓ Correct Answer' : '✕ Incorrect'}
              </div>
              {q.explanation && <div className="muted" style={{ lineHeight: 1.6 }}>{q.explanation}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="btn" onClick={() => { setSelected(null); setHasAnswered(false); setCurrent((c) => Math.max(0, c - 1)); }} disabled={current === 0}>Previous</button>
            <button className="btn btn--primary" onClick={goNext} disabled={!hasAnswered} style={{ marginLeft: 'auto', padding: '12px 40px' }}>
              {current < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      ) : (
        <div className="completion-screen" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{score === questions.length ? '🏆' : '👏'}</div>
          <h4 style={{ marginTop: 0, fontSize: '1.5rem' }}>Quiz Finished!</h4>
          <p className="muted" style={{ fontSize: '1.1rem' }}>You scored {score} out of {questions.length} correct.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button className="btn btn--primary" onClick={restart}>Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
