import { useEffect, useState } from 'react';

const Timeline = ({ response, onProgress, onComplete }) => {
  const [index, setIndex] = useState(0);
  const data = response?.data || response || {};
  const title = data.title || 'Timeline';
  const content = data.content || {};
  const steps = Array.isArray(content.steps) ? content.steps : [];

  useEffect(() => {
    const percent = steps.length ? Math.round(((index + 1) / steps.length) * 100) : 0;
    if (typeof onProgress === 'function') onProgress(percent);
    if (percent === 100 && typeof onComplete === 'function') onComplete();
  }, [index, steps.length, onProgress, onComplete]);

  if (steps.length === 0) {
    return (
      <div className="card card--padded empty-state" style={{ maxWidth: 600 }}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p>No timeline steps available. Try another topic or regenerate the lesson.</p>
      </div>
    );
  }

  return (
    <div className="card card--padded" style={{ maxWidth: 800, margin: '0 auto', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">{index + 1} / {steps.length} Steps</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', paddingLeft: '24px' }}>
        {/* Timeline Line */}
        <div style={{ 
          position: 'absolute', 
          left: '7px', 
          top: '0', 
          bottom: '0', 
          width: '2px', 
          background: 'var(--border)',
          zIndex: 0
        }} />

        {steps.map((s, i) => {
          const isActive = i === index;
          const isPast = i < index;

          return (
            <div 
              key={i} 
              style={{ 
                position: 'relative', 
                zIndex: 1, 
                opacity: isActive ? 1 : (isPast ? 0.6 : 0.3),
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onClick={() => setIndex(i)}
            >
              {/* Timeline Dot */}
              <div style={{ 
                position: 'absolute', 
                left: '-24px', 
                top: '8px', 
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                background: isActive ? 'var(--text-strong)' : (isPast ? 'var(--success)' : 'white'),
                border: '2px solid ' + (isActive ? 'var(--text-strong)' : 'var(--border)'),
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} />

              <div className="card" style={{ 
                padding: '24px', 
                cursor: 'pointer',
                border: isActive ? '1px solid var(--text-strong)' : '1px solid var(--border)',
                background: isActive ? '#f8fafc' : 'white',
                boxShadow: isActive ? '0 10px 30px rgba(0,0,0,0.05)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isActive ? 'var(--text-strong)' : 'inherit' }}>
                    {s.title || `Step ${i + 1}`}
                  </div>
                  {s.date && <div className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.date}</div>}
                </div>
                {(isActive || isPast) && (
                  <p className="muted" style={{ margin: 0, lineHeight: 1.6, fontSize: '1rem' }}>
                    {s.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '40px', justifyContent: 'center' }}>
        <button className="btn" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>Back</button>
        <button className="btn btn--primary" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} disabled={index === steps.length - 1} style={{ padding: '12px 40px' }}>
          {index === steps.length - 1 ? 'End reached' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default Timeline;
