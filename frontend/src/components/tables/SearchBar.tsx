import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import AdvancedSearchModal from '../modals/AdvancedSearchModal';
import type { AdvancedFilters } from '../../types';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  loading?: boolean;
  activeFilters?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onApplyFilters, 
  loading = false,
  activeFilters = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce implementation
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
        setIsTyping(false);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsTyping(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(searchTerm);
      setIsTyping(false);
    }
  };

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setIsTyping(false);
    onSearch('');
  }, [onSearch]);

  const showLoader = loading || isTyping;

  return (
    <div className="flex w-full mb-6 gap-3">
      <div className="relative flex-grow group">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon 
            className={`h-5 w-5 transition-all duration-300 ${
              showLoader ? 'text-blue-500 dark:text-cyan-400 scale-110' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-cyan-400'
            }`} 
            aria-hidden="true" 
          />
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Buscar por número, asunto, usuario, agente o sector..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="block w-full rounded-xl border-0 bg-white dark:bg-slate-800 py-3.5 pl-12 pr-14 text-base text-gray-900 dark:text-gray-200 shadow-lg shadow-gray-200/20 dark:shadow-slate-900/20 ring-1 ring-inset ring-gray-200 dark:ring-slate-700 transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-slate-500 hover:shadow-gray-200/30 dark:hover:shadow-slate-900/30 hover:ring-gray-300 dark:hover:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:focus:ring-cyan-500 focus:shadow-blue-200/10 dark:focus:shadow-cyan-900/10 focus:outline-none sm:leading-6"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {showLoader ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-cyan-400 border-t-transparent shadow-md shadow-blue-200/20 dark:shadow-cyan-500/20" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 focus:text-blue-500 dark:focus:text-cyan-400 focus:bg-gray-100 dark:focus:bg-slate-700/70 transition-all duration-200 rounded-full h-8 w-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:ring-opacity-50"
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Advanced Search Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center justify-center gap-2 rounded-xl border-0 px-4 py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:ring-opacity-50 ${activeFilters 
          ? 'bg-blue-600 dark:bg-cyan-600 text-white hover:bg-blue-500 dark:hover:bg-cyan-500 active:bg-blue-700 dark:active:bg-cyan-700 shadow-blue-200/20 dark:shadow-cyan-900/20 hover:shadow-blue-200/30 dark:hover:shadow-cyan-900/30' 
          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 ring-1 ring-inset ring-gray-200 dark:ring-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 hover:text-gray-900 dark:hover:text-slate-200 active:bg-gray-100 dark:active:bg-slate-700'}`}
      >
        {activeFilters ? (
          <FunnelIcon className="h-5 w-5 text-white" />
        ) : (
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        )}
        <span>Filtros</span>
        {activeFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600 dark:text-cyan-600 ml-1 shadow-md animate-pulse">
            !
          </span>
        )}
      </button>

      <AdvancedSearchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplyFilters={(filters) => {
          onApplyFilters(filters);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default SearchBar;
