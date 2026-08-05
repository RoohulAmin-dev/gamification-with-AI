import { useEffect, useState } from 'react';

const Simulation = ({ response, onProgress, onComplete }) => {
  const data = response?.data || response || {};
  const title = data.title || 'Simulation';
  const content = data.content || {};
  const steps = Array.isArray(content.steps) ? content.steps : [];
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  const prev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const reset = () => setCurrentStep(0);

  useEffect(() => {
    const percent = steps.length ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;
    if (typeof onProgress === 'function') onProgress(percent);
    if (percent === 100 && typeof onComplete === 'function') onComplete();
  }, [currentStep, steps.length, onProgress, onComplete]);

  if (steps.length === 0) {
    return (
      <div className="card card--padded empty-state" style={{ maxWidth: 600 }}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p>No simulation steps available. Regenerate the lesson or try another topic.</p>
      </div>
    );
  }

    return (
    <div className="card card--padded" style={{ maxWidth: 800, margin: '0 auto', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">Interactive Simulation</div>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '40px', marginBottom: '32px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 700, marginBottom: '16px' }}>
          Phase {currentStep + 1} of {steps.length}
        </div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-strong)' }}>
          {steps[currentStep]?.title || `Step ${currentStep + 1}`}
        </h3>
        <p className="muted" style={{ fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
          {steps[currentStep]?.description || 'Explore the mechanics of this step.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{ 
              width: i === currentStep ? '24px' : '8px', 
              height: '8px', 
              borderRadius: '999px', 
              background: i === currentStep ? 'var(--text-strong)' : 'var(--border)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
          <button className="btn" onClick={prev} disabled={currentStep === 0} style={{ padding: '12px 24px' }}>Back</button>
          <button className="btn btn--primary" onClick={next} disabled={currentStep === steps.length - 1} style={{ padding: '12px 48px' }}>
            {currentStep === steps.length - 1 ? 'Simulation Complete' : 'Continue Step'}
          </button>
          <button className="btn" onClick={reset} style={{ padding: '12px 24px' }}>Reset</button>
        </div>
      </div>

      <div className="mini-challenge" style={{ marginTop: '40px', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.5rem' }}>🕹️</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            Follow the sequence to understand how the system behaves under these conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
