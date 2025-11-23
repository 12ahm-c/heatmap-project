import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import LayersPanel from '../components/LayersPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import Tooltip from '../components/Tooltip';

function MapPage() {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showAnalytics, setShowAnalytics] = useState(!isMobile);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [geoData, setGeoData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);

  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [searchResults, setSearchResults] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: '' });

  // =======================================================
  //  🔍 Search
  // =======================================================
  const handleSearch = (results) => {
    if (!map) return;

    setSearchResults(results); 

    const newData = {
      type: 'FeatureCollection',
      features: results
    };

    setFilteredData(newData);

    if (results.length > 0) {
      const [lng, lat] = results[0].geometry.coordinates;
      map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
      setShowFilters(!mobile);
      setShowAnalytics(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =======================================================
  //  📥 Fetch Data from Server
  // =======================================================
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          'https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=5000'
        );
        const data = await res.json();

        const features = data
          .filter(d => d.latitude && d.longitude)
          .map(d => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)],
            },
            properties: {
              name: d.block || 'Unknown',
              type: d.primary_type || 'Crime',
              year: d.year || 'Unknown',
              description: d.description || '',
            },
          }));

        const geoJSON = { type: 'FeatureCollection', features };

        setGeoData(geoJSON);
        setFilteredData(geoJSON);

      } catch (err) {
        console.error('Error fetching API:', err);
      }
    }

    fetchData();
  }, []);

  // =======================================================
  //  🗺️ Create Map
  // =======================================================
  useEffect(() => {
    if (geoData && mapContainer.current && !map) {
      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-0.62, 34.77],
        zoom: 12
      });

      mapInstance.on('load', () => {
        mapInstance.addSource('points', { type: 'geojson', data: geoData });

        mapInstance.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'points',
          maxzoom: 15,
          paint: {
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'point_count'], 0, 0, 6, 1
            ],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'], 0, 1, 15, 3
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'], 0, 2, 15, 20
            ],
            'heatmap-opacity': [
              'interpolate', ['linear'], ['zoom'], 10, 0.8, 15, 0
            ]
          }
        });

        mapInstance.addLayer({
          id: 'points-symbol',
          type: 'circle',
          source: 'points',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'], 10, 4, 15, 10
            ],
            'circle-color': [
              'match', ['get', 'type'],
              'THEFT', '#e74c3c',
              'BATTERY', '#3498db',
              'NARCOTICS', '#9b59b6',
              'ROBBERY', '#f1c40f',
              'CRIMINAL DAMAGE', '#e67e22',
              'ASSAULT', '#2ecc71',
              'MOTOR VEHICLE THEFT', '#1abc9c',
              '#95a5a6'
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.8
          }
        });

        mapInstance.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'points',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6', 10,
              '#f1f075', 30,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, 10, 20, 30, 25
            ],
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // Tooltip
        mapInstance.on('mousemove', 'points-symbol', (e) => {
          if (e.features.length > 0) {
            const feature = e.features[0];

            setTooltip({
              x: e.point.x,
              y: e.point.y,
              content: feature.properties
            });
          } else {
            setTooltip({ x: 0, y: 0, content: null });
          }
        });

        mapInstance.on('mouseleave', 'points-symbol', () => {
          setTooltip({ x: 0, y: 0, content: null });
        });
      });

      setMap(mapInstance);
    }
  }, [geoData, map]);

  // =======================================================
  //  🎛️ Apply Filters
  // =======================================================
  useEffect(() => {
    if (!geoData) return;
    if (searchResults !== null) return;

    let filtered = geoData.features;

    if (filterType) {
      filtered = filtered.filter(f =>
        f.properties.type &&
        f.properties.type.trim().toLowerCase() === filterType.toLowerCase()
      );
    }

    if (filterYear) {
      filtered = filtered.filter(f =>
        f.properties.year &&
        f.properties.year.toString().trim() === filterYear.toString()
      );
    }

    const filteredGeoJSON = {
      type: 'FeatureCollection',
      features: filtered
    };

    setFilteredData(filteredGeoJSON);

    if (map && map.getSource('points')) {
      map.getSource('points').setData(filteredGeoJSON);
    }
  }, [filterType, filterYear, geoData, map, searchResults]);

  // =======================================================
  //  🧮 Sidebar Data
  // =======================================================
  let totalPoints = filteredData ? filteredData.features.length : 0;

  let topArea = "Not specified";
  if (filteredData && filteredData.features.length > 0) {
    const counts = {};
    filteredData.features.forEach(f => {
      const name = f.properties.name || 'Not specified';
      counts[name] = (counts[name] || 0) + 1;
    });

    topArea = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }

  const typeCounts = {};
  const yearCounts = {};

  filteredData?.features.forEach(f => {
    const type = f.properties.type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const year = f.properties.year || 'Unknown';
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  // =======================================================
  //  🔍 Zoom to top area
  // =======================================================
  const zoomToTopArea = () => {
    if (!map || !filteredData) return;

    const feature = filteredData.features.find(f => f.properties.name === topArea);
    if (feature) {
      const [lng, lat] = feature.geometry.coordinates;
      map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
    }
  };

  // =======================================================
  //  📱 Mobile Menu Toggle
  // =======================================================
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // =======================================================
  //  🖥️ Interface
  // =======================================================
  return (
    <div className="map-wrapper">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          onClick={toggleMobileMenu}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1001,
            background: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      )}

      {/* Map */}
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: isMobile ? '0' : '12px',
          boxShadow: isMobile ? 'none' : '0 8px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
      />

      {/* Filters */}
{/* Filters */}
{(showFilters || (isMobile && showMobileMenu)) && (
  <div style={{
    position: 'absolute',
    top: isMobile ? '100px' : '60px', // أسفل البحث مباشرة
    right: isMobile ? '5%' : '20px', // على اليمين
    width: isMobile ? '40%' : '180px', // تقليل الحجم
    background: 'rgba(255,255,255,0.95)',
    padding: isMobile ? '8px' : '12px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 1000
  }}>
    <label style={{ fontWeight: 600, fontSize: '12px' }}>Type:</label>
    <select
      style={{ padding: '4px', borderRadius: '6px', fontSize: '12px' }}
      value={filterType} onChange={e => setFilterType(e.target.value)}
    >
      <option value="">All</option>
      <option value="THEFT">THEFT</option>
      <option value="BATTERY">BATTERY</option>
      <option value="NARCOTICS">NARCOTICS</option>
      <option value="ROBBERY">ROBBERY</option>
      <option value="CRIMINAL DAMAGE">CRIMINAL DAMAGE</option>
      <option value="ASSAULT">ASSAULT</option>
      <option value="MOTOR VEHICLE THEFT">MOTOR VEHICLE THEFT</option>
    </select>

    <label style={{ fontWeight: 600, fontSize: '12px' }}>Year:</label>
    <select
      style={{ padding: '4px', borderRadius: '6px', fontSize: '12px' }}
      value={filterYear} onChange={e => setFilterYear(e.target.value)}
    >
      <option value="">All</option>
      <option value="2023">2023</option>
      <option value="2024">2024</option>
    </select>
  </div>
)}
{/* Search Bar */}
{/* Search Bar */}
<div style={{
  position: 'absolute',
  top: isMobile ? '10px' : '20px',
  left: isMobile ? '10px' : '50%',
  transform: isMobile ? 'none' : 'translateX(-50%)',
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '25px',
  padding: '2px 8px',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
  fontFamily: 'Segoe UI, sans-serif',
  width: isMobile ? '80%' : '250px', // تحديد عرض أصغر
  maxWidth: '250px', // الحد الأقصى للعرض على الشاشة الكبيرة
  zIndex: 1000
}}>
  <input
    type="text"
    placeholder="Search..."
    style={{
      border: 'none',
      outline: 'none',
      padding: '4px 6px',
      borderRadius: '20px',
      fontSize: isMobile ? '12px' : '13px',
      width: '100%'
    }}
    onChange={e => handleSearch(
      geoData.features.filter(f =>
        f.properties.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
        f.properties.type.toLowerCase().includes(e.target.value.toLowerCase())
      )
    )}
  />
  <button style={{
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    marginLeft: '4px',
    color: '#3498db',
    fontSize: isMobile ? '12px' : '14px'
  }}>🔍</button>
</div>
{/* Sidebar */}
{(showSidebar || (isMobile && showMobileMenu)) && (
  <div style={{
    position: 'absolute',
    top: isMobile ? '100px' : '60px', // أسفل البحث مباشرة
    left: isMobile ? '5%' : '20px', // على اليسار
    width: isMobile ? '40%' : '180px', // تقليل الحجم
    background: 'rgba(255,255,255,0.95)',
    padding: isMobile ? '8px' : '12px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 1000,
    color: 'black'
  }}>
    <h3 style={{ margin: 0, fontSize: '13px' }}>Statistics</h3>
    <p style={{ fontSize: '12px' }}><strong>Total Points:</strong> {totalPoints}</p>
    <p style={{ fontSize: '12px' }}><strong>Most Active Area:</strong> {topArea}</p>
    <button 
      onClick={zoomToTopArea}
      style={{
        marginTop: '6px',
        padding: '4px',
        borderRadius: '6px',
        border: 'none',
        background: '#3498db',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >Zoom</button>
  </div>
)}
      {/* Analytics */}
      {(showAnalytics || (isMobile && showMobileMenu)) && (
<div style={{
  position: 'absolute',
  bottom: isMobile ? '20px' : '20px',
  right: isMobile ? '5%' : '20px',
  left: isMobile ? '5%' : 'auto',
  fontFamily: 'Segoe UI, sans-serif',
  zIndex: 1000,
  maxHeight: isMobile ? '150px' : '200px',  // تحديد ارتفاع ثابت
  overflowY: 'auto',  // تمكين التمرير عند تعدي العدد
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '12px',
  padding: '10px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
}}>

  {/* Incidents by Type */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
    gap: '6px',
    justifyContent: 'center'
  }}>
    {Object.keys(typeCounts).map(type => (
      <div key={type} style={{
        background: '#fff',
        padding: '4px 6px',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        minWidth: '50px',
        textAlign: 'center',
        fontSize: '10px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '11px' }}>{typeCounts[type]}</div>
        <div style={{ fontSize: '10px', color: '#555' }}>{type}</div>
      </div>
    ))}
  </div>

  {/* Incidents by Year */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
    gap: '4px',
    justifyContent: 'center',
    marginTop: '6px'
  }}>
    {Object.keys(yearCounts).map(year => (
      <div key={year} style={{
        background: '#fff',
        padding: '3px 5px',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        minWidth: '40px',
        textAlign: 'center',
        fontSize: '10px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#3498db', fontSize: '11px' }}>{yearCounts[year]}</div>
        <div style={{ fontSize: '10px', color: '#555' }}>{year}</div>
      </div>
    ))}
  </div>
</div>
      )}

      {/* Tooltip */}
      <Tooltip
        style={{
          position: 'absolute',
          top: tooltip.y + 15,
          left: tooltip.x + 15,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '10px 15px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          fontSize: isMobile ? '12px' : '14px',
          pointerEvents: 'none',
          transition: 'all 0.2s ease',
          zIndex: 1000,
          maxWidth: isMobile ? '200px' : 'none'
        }}
        x={tooltip.x} y={tooltip.y} content={tooltip.content}
      />

      {/* Layers Panel */}
      {map && (showMobileMenu || !isMobile) && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '320px' : '280px',
          right: isMobile ? '5%' : '20px',
          left: isMobile ? '5%' : 'auto',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: isMobile ? '12px' : '15px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          fontFamily: 'Segoe UI, sans-serif',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '8px' : '10px',
          zIndex: 1000
        }}>
          <h4 style={{ margin: 0, marginBottom: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : 'inherit' }}>Layers</h4>

          <button style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#3498db',
            color: '#fff',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : 'inherit'
          }}
            onClick={() => {
              if (map.getLayer('heatmap-layer')) {
                const visibility = map.getLayoutProperty('heatmap-layer', 'visibility') || 'visible';
                map.setLayoutProperty('heatmap-layer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
              }
            }}
          >
            Toggle Heatmap
          </button>

          <button style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#e67e22',
            color: '#fff',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : 'inherit'
          }}
            onClick={() => {
              if (map.getLayer('points-symbol')) {
                const visibility = map.getLayoutProperty('points-symbol', 'visibility') || 'visible';
                map.setLayoutProperty('points-symbol', 'visibility', visibility === 'visible' ? 'none' : 'visible');
              }
            }}
          >
            Toggle Points
          </button>

          <button style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#2ecc71',
            color: '#fff',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : 'inherit'
          }}
            onClick={() => map.flyTo({ center: [-87.623177, 41.881832], zoom: 11 })}
          >
            Reset View
          </button>
        </div>
      )}
    </div>
  );
}

export default MapPage;