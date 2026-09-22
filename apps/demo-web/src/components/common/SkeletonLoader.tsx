import React from 'react';

interface SkeletonLoaderProps {
  type?: 'gauge' | 'text' | 'card';
  lines?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3
}) => {
  if (type === 'gauge') {
    return (
      <div className="skeleton-gauge-container">
        <div className="skeleton-gauge-circle shimmer" />
        <div className="skeleton-line shimmer" style={{ width: '60%', height: '18px', marginTop: '12px' }} />
        <div className="skeleton-line shimmer" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-card-container">
        <div className="skeleton-line shimmer" style={{ width: '45%', height: '16px', marginBottom: '14px' }} />
        <div className="skeleton-line shimmer" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '10px' }} />
        <div className="skeleton-line shimmer" style={{ width: '85%', height: '14px' }} />
      </div>
    );
  }

  return (
    <div className="skeleton-text-container">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line shimmer"
          style={{
            width: i === lines - 1 ? '65%' : '100%',
            height: '14px',
            marginBottom: i === lines - 1 ? '0' : '8px'
          }}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
