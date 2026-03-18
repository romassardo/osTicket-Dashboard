import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  position?: 'above' | 'below';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'above' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1">
      {children}
      <button
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
      {show && (
        <div 
          className="fixed z-[9999] px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-normal leading-relaxed pointer-events-none"
          style={{ maxWidth: 260, width: 'max-content', transform: 'translateX(-50%)' }}
          ref={(el) => {
            if (!el) return;
            const btn = el.parentElement?.querySelector('button');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            if (position === 'below') {
              el.style.top = `${rect.bottom + 8}px`;
              el.style.left = `${rect.left + rect.width / 2}px`;
            } else {
              el.style.top = `${rect.top - el.offsetHeight - 8}px`;
              el.style.left = `${rect.left + rect.width / 2}px`;
            }
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};
