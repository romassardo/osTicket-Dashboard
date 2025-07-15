// frontend/src/components/charts/ChartTooltip.tsx
import React from 'react';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const ChartTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="p-3 rounded-lg shadow-lg"
        style={{
          backgroundColor: '#252a35',
          border: '1px solid #2d3441',
        }}
      >
        <p className="label text-sm font-bold text-[#b8c5d6]">{`${label}`}</p>
        <p className="intro text-xs text-[#00d9ff]">
          {`${payload[0].name}: ${payload[0].value.toLocaleString()}`}
        </p>
      </div>
    );
  }

  return null;
}; 