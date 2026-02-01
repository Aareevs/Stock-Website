import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  hoverEffect = false
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };

  const hoverStyles = hoverEffect 
    ? "hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surfaceElevated transition-all duration-300" 
    : "";

  return (
    <div className={`bg-surface border border-border rounded-[14px] ${paddings[padding]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};