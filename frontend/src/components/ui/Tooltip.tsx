import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  position?: 'above' | 'below';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'above' }) => {
  const [show, setShow] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    const tip = tipRef.current;
    if (!btn || !tip) return;

    const rect = btn.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let top: number;
    if (position === 'below') {
      top = rect.bottom + 8;
    } else {
      top = rect.top - tipRect.height - 8;
    }

    let left = rect.left + rect.width / 2 - tipRect.width / 2;

    // Prevent overflow off right edge
    if (left + tipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tipRect.width - 8;
    }
    // Prevent overflow off left edge
    if (left < 8) {
      left = 8;
    }

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }, [position]);

  useEffect(() => {
    if (show) {
      // Use rAF to ensure the tooltip DOM is painted before measuring
      const id = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(id);
    }
  }, [show, updatePosition]);

  return (
    <div className="relative inline-flex items-center gap-1">
      {children}
      <button
        ref={btnRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow(prev => !prev);
        }}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
        type="button"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && createPortal(
        <div
          ref={tipRef}
          className="fixed z-[9999] px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-normal leading-relaxed pointer-events-none"
          style={{ maxWidth: 280 }}
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
};
