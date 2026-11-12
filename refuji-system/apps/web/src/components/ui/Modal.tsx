import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'unified' | 'dark';
}

// Tính năng: Quy chuẩn khung Modal cố định chung (trừ popup Login dùng variant='dark')
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '2xl',
  variant = 'unified'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.backdropDown = e.target === e.currentTarget ? '1' : '0';
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.currentTarget.dataset.backdropDown !== '0') {
      onClose();
    }
    delete e.currentTarget.dataset.backdropDown;
  };

  if (variant === 'dark') {
    const darkWidth = maxWidth === '2xl' ? 'max-w-md' : widthClasses[maxWidth];
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onMouseDown={handleBackdropMouseDown}
        onClick={handleBackdropClick}
      >
        <div
          className={`w-full ${darkWidth} bg-[#0f131c] border border-white/20 rounded-3xl shadow-2xl p-6 relative text-zinc-100 max-h-[90vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {title && <h2 className="text-xl font-bold font-serif tracking-wide mb-1 text-white">{title}</h2>}
          {description && <p className="text-xs text-zinc-400 mb-5">{description}</p>}

          <div className="mt-2">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-2xl bg-[#f5f6f8] rounded-[28px] p-3 sm:p-3.5 shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/12 overflow-hidden flex flex-col h-[670px] max-h-[90vh] text-[#14171f] select-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 min-h-0 w-full bg-white rounded-2xl border border-[#14171f]/12 shadow-[0_2px_10px_rgba(20,24,32,0.03)] overflow-hidden flex flex-col">
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[#62687a] hover:text-[#14171f] bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>

          {(title || description) && (
            <div className="px-6 sm:px-8 py-5 pb-4 border-b border-[#14171f]/10 pr-16 shrink-0">
              {title && <h2 className="text-xl sm:text-2xl font-medium font-serif tracking-tight text-[#14171f]">{title}</h2>}
              {description && <p className="text-xs text-[#6e7587] mt-0.5">{description}</p>}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
