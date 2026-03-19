import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import AdvancedSearchModal from '../modals/AdvancedSearchModal';
import type { AdvancedFilters } from '../../types';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  loading?: boolean;
  activeFilters?: boolean;
  showSlaStatus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onApplyFilters, 
  loading = false,
  activeFilters = false,
  showSlaStatus = false 
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
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon 
            className="h-5 w-5 transition-all duration-300"
            style={{ color: showLoader ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            aria-hidden="true" 
          />
        </div>

        <input
          type="text"
          placeholder="Buscar por número, asunto, usuario, agente o sector..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="block w-full border-0 transition-all duration-300 focus:outline-none sm:leading-6"
          style={{ 
            background: 'var(--bg-secondary)', 
            color: 'var(--text-primary)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '0.875rem 3.5rem 0.875rem 3rem', 
            fontSize: '0.875rem', 
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {showLoader ? (
            <div className="animate-spin rounded-full h-5 w-5" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }} />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="transition-all duration-200 rounded-full h-8 w-8 flex items-center justify-center focus:outline-none"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '0.875rem 1.25rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          boxShadow: 'var(--shadow-sm)',
          background: activeFilters ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: activeFilters ? 'var(--bg-primary)' : 'var(--text-secondary)',
          border: activeFilters ? 'none' : '1px solid var(--border-subtle)',
        }}
      >
        {activeFilters ? (
          <FunnelIcon className="h-5 w-5" />
        ) : (
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        )}
        <span>Filtros</span>
        {activeFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ml-1 animate-pulse" style={{ background: 'white', color: 'var(--accent-primary)' }}>
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
        showSlaStatus={showSlaStatus}
      />
    </div>
  );
};

export default SearchBar;
