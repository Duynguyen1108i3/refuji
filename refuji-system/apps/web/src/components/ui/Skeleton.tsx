import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular'
}) => {
  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-white/10 ${variantClasses[variant]} ${className}`}
    />
  );
};
