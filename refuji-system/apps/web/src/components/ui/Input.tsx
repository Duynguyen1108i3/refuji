import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
          error ? 'border-rose-500/80 bg-rose-950/20' : 'border-white/15 hover:border-white/25'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
      {helperText && !error && <span className="text-xs text-zinc-400">{helperText}</span>}
    </div>
  );
};
