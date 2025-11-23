import React from 'react';

function Sidebar({ totalPoints, topArea, onZoomToTop }) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      width: 220,
      backgroundColor: ' rgba(0,0,0,0.3)',
      padding: 15,
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    
    }}>
    </div>
  );
}

export default Sidebar;
