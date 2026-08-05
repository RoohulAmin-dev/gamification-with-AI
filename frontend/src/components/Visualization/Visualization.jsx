import { useEffect, useState } from 'react';

const Visualization = ({ response, onProgress, onComplete }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const data = response?.data || response || {};
  const title = data.title || 'Visualization';
  const content = data.content || {};
  const items = Array.isArray(content.items) ? content.items : [];

  useEffect(() => {
    const percent = selectedIndex !== null ? 100 : 0;
    if (typeof onProgress === 'function') onProgress(percent);
    if (percent === 100 && typeof onComplete === 'function') onComplete();
  }, [selectedIndex, onProgress, onComplete]);

  if (items.length === 0) {
    return (
      <div className="card card--padded empty-state" style={{ maxWidth: 600 }}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p>No visualization items available. Select a topic and regenerate the lesson.</p>
      </div>
    );
  }

    return (
    <div className="card card--padded" style={{ maxWidth: 800, margin: '0 auto', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">{items.length} Key Concepts</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {items.map((item, index) => {
          const isSelected = selectedIndex === index;
          const label = typeof item === 'string' ? item : item.label || item.description || `Concept ${index + 1}`;
          
          return (
            <div
              key={index}
              onClick={() => setSelectedIndex((s) => (s === index ? null : index))}
              className="card"
              style={{
                padding: '24px',
                cursor: 'pointer',
                background: isSelected ? 'var(--text-strong)' : '#f8fafc',
                color: isSelected ? 'white' : 'var(--text-strong)',
                border: isSelected ? '1px solid var(--text-strong)' : '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isSelected ? '0 20px 40px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: isSelected ? 'rgba(255,255,255,0.1)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem'
                }}>
                  {index + 1}
                </div>
                {item?.meta && <div className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: isSelected ? 'white' : 'var(--text-muted)', border: 'none' }}>{item.meta}</div>}
              </div>

              <h5 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700 }}>{label}</h5>
              
              <div style={{ 
                maxHeight: isSelected ? '500px' : '0px', 
                overflow: 'hidden', 
                transition: 'all 0.4s ease',
                opacity: isSelected ? 1 : 0
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, opacity: isSelected ? 0.9 : 0 }}>
                  {item.details || 'Explore this concept to understand the core mechanics.'}
                </p>
              </div>
              
              {!isSelected && <div className="muted" style={{ fontSize: '0.8rem', marginTop: '8px' }}>Click to expand</div>}
            </div>
          );
        })}
      </div>

      <div className="mini-challenge" style={{ marginTop: '40px', textAlign: 'center' }}>
        <p className="muted" style={{ margin: 0 }}>Click on each card to reveal detailed visual explanations.</p>
      </div>
    </div>
  );
};

export default Visualization;
