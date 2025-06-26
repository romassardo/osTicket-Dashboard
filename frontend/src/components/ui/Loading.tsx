import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  // Basic spinner, consider using SVG or a library for better visuals
  const sizeClass = `spinner-${size}`;
  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClass}`}></div>
      {text && <p className="loading-text">{text}</p>}
      <p>Loading Placeholder</p>
    </div>
  );
};

export default Loading;
