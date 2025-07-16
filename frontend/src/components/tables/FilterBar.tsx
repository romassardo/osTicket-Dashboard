import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterBarProps {
  onSearch: (searchTerm: string) => void;
  loading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  // Execute search when debounced term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
    <div className="relative w-full max-w-md mx-auto mb-6">
      <div className="relative">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon 
            className={`h-5 w-5 transition-colors duration-200 ${
              showLoader ? 'text-blue-500 dark:text-violet-500' : 'text-gray-400 dark:text-slate-400'
            }`} 
            aria-hidden="true" 
          />
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Buscar en tickets por número, asunto, usuario, agente o sector..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`
            block w-full rounded-lg border-0 bg-white dark:bg-slate-700/50 py-3 pl-11 pr-12 
            text-gray-900 dark:text-slate-300 ring-1 ring-inset transition-all duration-200
            placeholder:text-gray-500 dark:placeholder:text-slate-400 sm:text-sm sm:leading-6
            ${showLoader 
              ? 'ring-blue-500 dark:ring-violet-500/50 bg-gray-50 dark:bg-slate-700/70' 
              : 'ring-gray-300 dark:ring-slate-600 hover:ring-gray-400 dark:hover:ring-slate-500'
            }
            focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:focus:ring-violet-500 focus:bg-gray-50 dark:focus:bg-slate-700/70
            focus:outline-none
          `}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {showLoader ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 dark:border-violet-500 border-t-transparent" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 focus:text-gray-600 dark:focus:text-slate-300 transition-colors duration-200"
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Status Indicator */}
      {searchTerm && (
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>
            {isTyping ? 'Escribiendo...' : `Buscando: "${searchTerm}"`}
          </span>
          {!isTyping && (
            <span className="text-slate-500">
              Presiona Enter para búsqueda inmediata
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
