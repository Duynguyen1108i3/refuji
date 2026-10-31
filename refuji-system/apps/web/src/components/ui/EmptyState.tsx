import React from 'react';
import { Camera } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/15 rounded-2xl bg-white/[0.02] max-w-md mx-auto my-6">
      <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4 text-emerald-400">
        {icon || <Camera className="w-8 h-8 opacity-80" />}
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
