// Bộ chọn tùy chọn Liquid Glass phong cách Trang chủ ReFuji, dùng thay thế toàn bộ native <select>
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export interface GlassSelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  dotClass?: string;
  disabled?: boolean;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  menuTitle?: string;
  size?: 'sm' | 'md';
  variant?: 'white' | 'surface';
  align?: 'left' | 'right';
  minMenuWidth?: number;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  title?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn tùy chọn',
  menuTitle,
  size = 'md',
  variant = 'white',
  align = 'left',
  minMenuWidth,
  disabled = false,
  className = '',
  buttonClassName = '',
  ariaLabel,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 12;
    const gap = 8;

    const hasDescriptions = options.some((o) => Boolean(o.description));
    const itemHeight = hasDescriptions ? 52 : 38;
    const estimatedHeight = Math.min(340, options.length * itemHeight + (menuTitle ? 36 : 16));

    const spaceBelow = viewportH - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const placement: 'bottom' | 'top' =
      spaceBelow < Math.min(220, estimatedHeight) && spaceAbove > spaceBelow ? 'top' : 'bottom';

    const maxHeight = Math.max(140, Math.min(340, placement === 'bottom' ? spaceBelow - gap : spaceAbove - gap));
    const targetWidth = Math.max(rect.width, minMenuWidth || (hasDescriptions ? 260 : 210));
    const clampedWidth = Math.min(targetWidth, viewportW - margin * 2);

    let left = align === 'right' ? rect.right - clampedWidth : rect.left;
    if (left + clampedWidth > viewportW - margin) {
      left = Math.max(margin, viewportW - margin - clampedWidth);
    }
    if (left < margin) {
      left = margin;
    }

    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(margin, rect.top - gap);

    setCoords({
      top,
      left,
      width: clampedWidth,
      maxHeight,
      placement,
    });
  }, [options, menuTitle, minMenuWidth, align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleResize = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const sizeClass =
    size === 'sm'
      ? 'h-8 px-3 text-[11.5px] font-semibold gap-1.5'
      : 'h-[42px] px-4 text-xs font-semibold gap-2';

  const surfaceClass =
    variant === 'surface'
      ? 'bg-[#f7f8fa] hover:bg-white border border-[#14171f]/12 hover:border-[#14171f]/25 shadow-2xs'
      : 'bg-white hover:bg-[#fafbfc] border border-[#14171f]/12 hover:border-[#14171f]/25 shadow-[0_2px_10px_rgba(20,24,32,0.04)]';

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        title={title}
        className={`w-full rounded-full flex items-center justify-between text-left text-[#14171f] transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14171f]/15 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${surfaceClass} ${
          isOpen ? 'border-[#14171f]/30 bg-white ring-2 ring-[#14171f]/[0.06]' : ''
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          {selectedOption?.dotClass && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedOption.dotClass}`} />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className={`shrink-0 text-[#5a6072] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#14171f]' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && coords && (
              <motion.div
                ref={menuRef}
                role="listbox"
                initial={{
                  opacity: 0,
                  y: coords.placement === 'bottom' ? -4 : 4,
                  scale: 0.97,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: coords.placement === 'bottom' ? -4 : 4,
                  scale: 0.97,
                }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'fixed',
                  left: coords.left,
                  top: coords.placement === 'bottom' ? coords.top : undefined,
                  bottom: coords.placement === 'top' ? window.innerHeight - coords.top : undefined,
                  width: coords.width,
                  zIndex: 280,
                }}
                className="liquid-glass-menu rounded-3xl p-2 shadow-[0_22px_54px_rgba(20,24,32,0.16)] border border-[#14171f]/10 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {menuTitle && (
                  <div className="text-[10px] uppercase font-bold text-[#747b8c] px-3 py-1 mb-1 tracking-wider">
                    {menuTitle}
                  </div>
                )}
                <div
                  className="overflow-y-auto space-y-1 pr-0.5"
                  style={{ maxHeight: coords.maxHeight }}
                >
                  {options.map((opt) => {
                    const isSelected = opt.value === value;
                    const hasDesc = Boolean(opt.description);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => {
                          if (opt.disabled) return;
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`w-full px-3.5 ${
                          hasDesc ? 'py-2 rounded-2xl' : 'py-2 rounded-full'
                        } text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-[#14171f]/[0.08] text-[#14171f] font-semibold border border-[#14171f]/12 shadow-2xs'
                            : 'text-[#383d4c] hover:text-[#14171f] hover:bg-[#14171f]/[0.045] border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {opt.dotClass && (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />
                            )}
                            <span className="truncate">{opt.label}</span>
                            {opt.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-white border border-[#14171f]/10 text-[10px] font-bold text-[#4b5262] num shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p className="text-[10.5px] font-normal text-[#6e7587] leading-snug mt-0.5">
                              {opt.description}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check size={14} className="text-[#14171f] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
