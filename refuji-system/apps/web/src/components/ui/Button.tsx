import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-emerald-400 focus-visible:outline-offset-2';

  const sizeClasses = {
    sm: 'min-h-[38px] px-3.5 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2', // Min 44px touch target
    lg: 'min-h-[50px] px-6 py-3 text-base gap-2.5 font-semibold'
  };

  // Primary variant uses Fujifilm Green with WCAG AA compliance
  const variantClasses = {
    primary: 'bg-[#00805e] hover:bg-[#006b4f] text-white shadow-lg shadow-emerald-950/40 active:scale-[0.98]',
    secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/15 active:scale-[0.98]',
    outline: 'bg-transparent border border-white/25 hover:border-emerald-400/60 hover:bg-emerald-500/10 text-zinc-200 hover:text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/40'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Đang xử lý...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
