import { useEffect, useState } from 'react';

const Diagram = ({ response, onProgress, onComplete }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const data = response?.data || response || {};
  const title = data.title || 'Diagram';
  const content = data.content || {};
  const nodes = Array.isArray(content.nodes) ? content.nodes : [];
  const connections = Array.isArray(content.connections) ? content.connections : [];

  useEffect(() => {
    const percent = selectedNode !== null ? 100 : 0;
    if (typeof onProgress === 'function') onProgress(percent);
    if (percent === 100 && typeof onComplete === 'function') onComplete();
  }, [selectedNode, onProgress, onComplete]);

  const nodeById = (n) => n.id ?? null;

    return (
    <div className="card card--padded" style={{ maxWidth: 900, margin: '0 auto', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        <div className="badge">{nodes.length} Components</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Visual Map Area */}
        <div className="card" style={{ background: '#f8fafc', padding: '32px', position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            {nodes.map((node, index) => {
              const id = nodeById(node) ?? index;
              const isSelected = selectedNode === id;
              
              return (
                <div
                  key={id}
                  onClick={() => setSelectedNode(id)}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: isSelected ? 'var(--text-strong)' : 'white',
                    color: isSelected ? 'white' : 'var(--text-strong)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: isSelected ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}
                >
                  {node.label || node.id || `Component ${index + 1}`}
                </div>
              );
            })}
          </div>

          {/* SVG for connections - simple abstraction */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.1 }}>
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="mini-challenge" style={{ margin: 0, padding: '20px' }}>
            <h5 style={{ margin: '0 0 12px 0', fontWeight: 700 }}>Relationships</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {connections.map((c, i) => {
                const from = c.from ?? c.source ?? null;
                const to = c.to ?? c.target ?? null;
                const isRelevant = selectedNode === from || selectedNode === to;
                
                return (
                  <div key={i} style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    background: isRelevant ? 'white' : 'transparent',
                    border: isRelevant ? '1px solid var(--border)' : '1px solid transparent',
                    fontSize: '0.85rem',
                    opacity: isRelevant ? 1 : 0.5,
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontWeight: 700 }}>{from}</span>
                    <span style={{ margin: '0 8px', opacity: 0.5 }}>→</span>
                    <span style={{ fontWeight: 700 }}>{to}</span>
                    {c.label && <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.label}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <h5 style={{ margin: '0 0 12px 0', fontWeight: 700 }}>Component Details</h5>
            {selectedNode !== null ? (
              <div style={{ animation: 'textFade 0.3s ease' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent)' }}>
                  {nodes.find((n, i) => (n.id ?? i) === selectedNode)?.label || selectedNode}
                </div>
                <p className="muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {(nodes.find((n, i) => (n.id ?? i) === selectedNode)?.description) || 'Click a component to see how it works.'}
                </p>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: '0.9rem' }}>Select a component to view its role in the system.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagram;
