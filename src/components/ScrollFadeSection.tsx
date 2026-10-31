import React from 'react';

interface ScrollFadeSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const ScrollFadeSection: React.FC<ScrollFadeSectionProps> = ({ id, className = '', children }) => {
  return (
    <div id={id} className={`w-full ${className}`}>
      {children}
    </div>
  );
};
