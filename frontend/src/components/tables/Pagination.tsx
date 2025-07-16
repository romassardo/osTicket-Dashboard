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

  return (
    <div className="flex justify-between items-center mt-5 text-sm">
      <span className="text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700/50 shadow-sm">
        Página <span className="text-blue-600 dark:text-cyan-400 font-semibold">{current_page}</span> de <span className="text-gray-700 dark:text-slate-200 font-semibold">{total_pages}</span>
      </span>
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePrevious}
          disabled={current_page <= 1}
          className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 shadow-lg shadow-gray-200/20 dark:shadow-slate-900/20 hover:bg-gray-50 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-cyan-400 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-gray-200/30 dark:hover:shadow-slate-900/30 active:bg-gray-100 dark:active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-gray-500 dark:disabled:hover:text-slate-500 disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all duration-200"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span>Anterior</span>
        </button>
        <button
          onClick={handleNext}
          disabled={current_page >= total_pages}
          className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 shadow-lg shadow-gray-200/20 dark:shadow-slate-900/20 hover:bg-gray-50 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-cyan-400 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-gray-200/30 dark:hover:shadow-slate-900/30 active:bg-gray-100 dark:active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-gray-500 dark:disabled:hover:text-slate-500 disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all duration-200"
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <ChevronRightIcon className="h-5 w-5 ml-1 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
