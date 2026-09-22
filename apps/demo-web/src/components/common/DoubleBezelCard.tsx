import React from 'react';

interface DoubleBezelCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  innerStyle?: React.CSSProperties;
}

export const DoubleBezelCard: React.FC<DoubleBezelCardProps> = ({
  children,
  className = '',
  style = {},
  glowColor,
  headerLeft,
  headerRight,
  innerStyle = {}
}) => {
  return (
    <div
      className={`bezel-card ${className}`}
      style={{
        ...style,
        ...(glowColor ? { '--card-glow': glowColor } as React.CSSProperties : {})
      }}
    >
      <div className="bezel-card-inner" style={innerStyle}>
        {(headerLeft || headerRight) && (
          <div className="bezel-card-header">
            <div className="bezel-card-header-left">{headerLeft}</div>
            {headerRight && <div className="bezel-card-header-right">{headerRight}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default DoubleBezelCard;
