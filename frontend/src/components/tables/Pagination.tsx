import React from 'react';
import type { PaginationInfo } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { current_page, total_pages } = pagination;

  const handlePrevious = () => {
    if (current_page > 1) {
      onPageChange(current_page - 1);
    }
  };

  const handleNext = () => {
    if (current_page < total_pages) {
      onPageChange(current_page + 1);
    }
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.45rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div className="flex justify-between items-center mt-5 text-sm">
      <span style={{ color: 'var(--text-muted)', fontWeight: 500, background: 'var(--bg-tertiary)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
        Página <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{current_page}</span> de <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total_pages}</span>
      </span>
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePrevious}
          disabled={current_page <= 1}
          style={{ ...btnStyle, opacity: current_page <= 1 ? 0.5 : 1, cursor: current_page <= 1 ? 'not-allowed' : 'pointer' }}
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          <span>Anterior</span>
        </button>
        <button
          onClick={handleNext}
          disabled={current_page >= total_pages}
          style={{ ...btnStyle, opacity: current_page >= total_pages ? 0.5 : 1, cursor: current_page >= total_pages ? 'not-allowed' : 'pointer' }}
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
