import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AnalyticsPanel({ data }) {
  if (!data || data.length === 0) return null;

  const counts = {};
  data.forEach(f => {
    const name = f.properties.name || 'non available';
    counts[name] = (counts[name] || 0) + 1;
  });

  const chartData = Object.keys(counts).map(key => ({ name: key, count: counts[key] }));

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: 300,
      height: 200,
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: 10,
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnalyticsPanel;
