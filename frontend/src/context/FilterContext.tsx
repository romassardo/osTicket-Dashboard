import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FilterContextType {
  /** Selected year (e.g. 2026) */
  selectedYear: number;
  /** Selected month 0-indexed (0=Jan, 11=Dec), or null for "all months" */
  selectedMonth: number | null;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth());

  return (
    <FilterContext.Provider value={{ selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
