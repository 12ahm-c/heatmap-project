import React, { useState } from 'react';

function SearchBar({ data, onSearch }) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query) return;
    const results = data.filter(f => 
      (f.properties.name && f.properties.name.toLowerCase().includes(query.toLowerCase())) ||
      (f.properties.type && f.properties.type.toLowerCase().includes(query.toLowerCase())) ||
      (f.properties.year && f.properties.year.toString() === query)
    );
    onSearch(results);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 240,
      width: 220,
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 10,
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 5, padding: 5 }}
      />
      <button onClick={handleSearch} style={{ width: '100%', padding: 5 }}>بحث</button>
    </div>
  );
}

export default SearchBar;
