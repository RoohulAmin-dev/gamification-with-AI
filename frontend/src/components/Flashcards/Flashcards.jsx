import { useMemo, useState, useEffect } from 'react';

const Flashcards = ({ response, onProgress, onComplete }) => {
  const data = response?.data || response || {};
  const content = data.content || {};
  const title = data.title || 'Flashcards';
  const cards = useMemo(() => (
    Array.isArray(content.cards)
      ? content.cards
      : (content.front || content.back ? [{ front: content.front, back: content.back, hint: content.hint }] : [])
  ), [content]);

  const total = cards.length || 0;
  const [remaining, setRemaining] = useState(() => cards.map((_, i) => i));
  const [currentIndex, setCurrentIndex] = useState(0); // index inside remaining array
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentCardIdx = remaining[currentIndex];
  const activeCard = cards[currentCardIdx] || {};

  const progress = total ? (total - remaining.length) : 0;
  const progressPercent = total ? Math.round((progress / total) * 100) : 0;

  useEffect(() => {
    if (typeof onProgress === 'function') {
      onProgress(progressPercent);
    }
  }, [progressPercent, onProgress]);

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : remaining.length - 1));
  };

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < remaining.length - 1 ? i + 1 : 0));
  };

  const handleKnow = () => {
    setFlipped(false);
    setRemaining((r) => {
      const next = r.filter((_, idx) => idx !== currentIndex);
      if (next.length === 0) {
        setCompleted(true);
        if (typeof onComplete === 'function') onComplete();
        return [];
      }
      setCurrentIndex((ci) => (ci >= next.length ? 0 : ci));
      return next;
    });
  };

  const handleReviewAgain = () => {
    setFlipped(false);
    setRemaining((r) => {
      const item = r[currentIndex];
      const next = r.filter((_, idx) => idx !== currentIndex).concat(item);
      setCurrentIndex((ci) => (ci >= next.length ? 0 : ci));
      return next;
    });
  };

  const handleRestart = () => {
    setRemaining(cards.map((_, i) => i));
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);
  };

    return (
    <div className="card card--padded" style={{ maxWidth: 600, margin: '0 auto', background: 'white' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">{progress}/{total} Cards</div>
      </div>

      {!completed ? (
        <>
          <div style={{ perspective: 1000, marginBottom: 'var(--space-md)' }}>
            <div
              onClick={() => setFlipped((f) => !f)}
              style={{
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: '24px',
                padding: '40px',
                cursor: 'pointer',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                background: flipped ? 'var(--text-strong)' : '#f8fafc',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ backfaceVisibility: 'hidden', position: 'absolute' }}>
                <p style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, color: 'var(--text-strong)' }}>{activeCard.front || '—'}</p>
                <div className="muted" style={{ marginTop: '20px', fontSize: '0.9rem' }}>Click to flip</div>
              </div>
              <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute' }}>
                <p style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, color: 'white' }}>{activeCard.back || '—'}</p>
                <div style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.6, color: 'white' }}>Click to flip</div>
              </div>
            </div>
          </div>

          {activeCard.hint && !flipped && (
            <div className="mini-challenge" style={{ marginBottom: 'var(--space-md)', padding: '12px 16px' }}>
              <span style={{ fontWeight: 700, marginRight: '8px' }}>💡 Hint:</span> {activeCard.hint}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <button className="btn btn--primary" type="button" onClick={handleKnow} style={{ flex: 1, background: 'var(--success)' }}>Got it</button>
            <button className="btn" type="button" onClick={handleReviewAgain} style={{ flex: 1 }}>Needs work</button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" type="button" onClick={goPrev} style={{ flex: 1, fontSize: '0.8rem' }}>Previous</button>
            <button className="btn" type="button" onClick={goNext} style={{ flex: 1, fontSize: '0.8rem' }}>Next</button>
          </div>
        </>
      ) : (
        <div className="completion-screen" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌟</div>
          <h4 style={{ marginTop: 0, fontSize: '1.5rem' }}>Deck Mastered!</h4>
          <p className="muted">You've reviewed all cards in this set.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: '24px' }}>
            <button className="btn btn--primary" onClick={handleRestart} style={{ flex: 1 }}>Restart Deck</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
