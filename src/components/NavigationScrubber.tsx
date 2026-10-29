import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface NavScrubberItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
}

export interface NavigationScrubberProps {
  activeId: string;
  onChange: (id: string) => void;
  items: NavScrubberItem[];
  variant?: 'mobile-dock' | 'header' | 'compact';
  className?: string;
}

export const NavigationScrubber: React.FC<NavigationScrubberProps> = ({
  activeId,
  onChange,
  items,
  variant = 'header',
  className = '',
}) => {
  const isMobileDock = variant === 'mobile-dock';
  const isCompact = variant === 'compact';

  // Find index of current activeId
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const safeActiveIndex = activeIndex !== -1 ? activeIndex : 0;

  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(safeActiveIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Sync selected index with activeId only when NOT dragging
  useEffect(() => {
    if (!isDragging) {
      setSelectedIndex(safeActiveIndex);
    }
  }, [safeActiveIndex, isDragging]);

  // Exact pointer scrubbing logic from RytoxGroup
  const handlePointerDown = (index: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (_) {}

    startPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    setIsDragging(true);
    setSelectedIndex(index);

    const onPointerMove = (ev: PointerEvent) => {
      const dx = Math.abs(ev.clientX - startPos.current.x);
      const dy = Math.abs(ev.clientY - startPos.current.y);
      if (dx > 6 || dy > 6) {
        hasMoved.current = true;
      }

      // Check which button is under the cursor
      let foundIndex = -1;
      let minDistance = Infinity;

      buttonRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
          foundIndex = idx;
          minDistance = 0;
        } else {
          const dist = Math.min(Math.abs(ev.clientX - rect.left), Math.abs(ev.clientX - rect.right));
          if (dist < minDistance) {
            minDistance = dist;
            foundIndex = idx;
          }
        }
      });

      if (foundIndex !== -1) {
        setSelectedIndex((prev) => {
          if (prev !== foundIndex) {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate(8);
              } catch (_) {}
            }
            return foundIndex;
          }
          return prev;
        });
      }
    };

    const onPointerUp = () => {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (_) {}

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      setIsDragging(false);

      setSelectedIndex((finalIdx) => {
        const item = items[finalIdx];
        if (item) {
          onChange(item.id);
        }
        return finalIdx;
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const displayIndex = isDragging 
    ? selectedIndex 
    : hoveredIndex !== null 
    ? hoveredIndex 
    : safeActiveIndex;

  return (
    <nav
      role="navigation"
      aria-label="Navigation Scrubber"
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative isolate select-none touch-none transition-all flex items-center ${
        isMobileDock
          ? 'crystal-liquid-glass rounded-full p-2 gap-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)]'
          : isCompact
          ? 'crystal-liquid-glass rounded-full p-1 sm:p-1.5 gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex-nowrap overflow-x-auto scrollbar-none'
          : 'crystal-liquid-glass rounded-full p-2 px-3 gap-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
      } ${className}`}
    >
      {items.map((item, idx) => {
        const isActive = idx === displayIndex;
        return (
          <button
            key={item.id}
            ref={(el) => { buttonRefs.current[idx] = el; }}
            onPointerDown={(e) => handlePointerDown(idx, e)}
            onMouseEnter={() => setHoveredIndex(idx)}
            onClick={() => {
              onChange(item.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            className={`relative z-10 flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none ${
              isMobileDock
                ? 'flex-col gap-1 px-4 py-2 min-w-[62px] rounded-full'
                : isCompact
                ? 'flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-full whitespace-nowrap'
                : 'px-6 sm:px-7 py-2.5 sm:py-3 text-sm font-semibold rounded-full whitespace-nowrap'
            } ${
              isActive ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            {/* Active Fluid Slider Lens (Framer Motion Spring Physics) */}
            {isActive && (
              <motion.div
                layoutId={`active-nav-pill-${variant}`}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
              />
            )}

            {/* Icon */}
            {(isMobileDock || isCompact) && item.icon && (
              <span
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-105 text-white' : 'text-white/70'
                }`}
              >
                {item.icon}
              </span>
            )}

            {/* Label */}
            <span
              className={`tracking-wide transition-colors duration-200 ${
                isMobileDock
                  ? 'text-[10px] font-medium leading-tight'
                  : isCompact
                  ? 'text-xs font-semibold'
                  : 'text-sm font-semibold'
              } ${isActive ? 'font-bold text-white' : 'text-white/70'}`}
            >
              {isMobileDock && item.shortLabel ? item.shortLabel : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
