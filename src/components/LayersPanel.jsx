import React, { useState } from 'react';

function LayersPanel({ map }) {
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(true);

  const toggleLayer = (layerId, visible, setVisible) => {
    if (!map) return;

    const visibility = visible ? 'none' : 'visible';
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
      setVisible(!visible);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 10,
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      <div>
        <input
          type="checkbox"
          checked={heatmapVisible}
          onChange={() => toggleLayer('heatmap-layer', heatmapVisible, setHeatmapVisible)}
          id="heatmap"
        />
        <label htmlFor="heatmap">Heatmap</label>
      </div>
      <div>
        <input
          type="checkbox"
          checked={pointsVisible}
          onChange={() => toggleLayer('points-symbol', pointsVisible, setPointsVisible)}
          id="points"
        />
        <label htmlFor="points">Points</label>
      </div>
    </div>
  );
}

export default LayersPanel;
