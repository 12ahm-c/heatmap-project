import React from 'react';

function Filters({ filters, setFilters }) {

  const handleTypeChange = (e) => {
    setFilters({ ...filters, type: e.target.value });
  }

  const handleYearChange = (e) => {
    setFilters({ ...filters, year: e.target.value });
  }

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: 200,
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 15,
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      fontFamily: 'Arial, sans-serif',
      zIndex: 10  
    }}>
    </div>
  );
}

export default Filters;
