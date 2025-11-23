import React from 'react';

function Tooltip({ x, y, content }) {
  if (!content) return null;

  return (
    <div style={{
      position: 'absolute',
      top: y + 10,
      left: x + 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 6,
      pointerEvents: 'none',
      fontSize: 14,
      zIndex: 1000
    }}>
      <div><strong>quartier:</strong> {content.name}</div>
      {content.type && <div><strong>type:</strong> {content.type}</div>}
      {content.year && <div><strong>year:</strong> {content.year}</div>}
      {content.description && <div>{content.description}</div>}
    </div>
  );
}

export default Tooltip;
