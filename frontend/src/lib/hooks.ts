/**
 * Custom hooks reutilizables para optimización de performance
 * Creado como parte de la fase REACT OPTIMIZATION [[memory:2988538]]
 */

import { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';

/**
 * Hook useDebounce para optimizar búsquedas y evitar llamadas excesivas a APIs
 * 
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos (por defecto 500ms)
 * @returns Valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Llamar API solo después del delay
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Crear timeout para actualizar el valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar timeout si value o delay cambian antes de completarse
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook useDebounceCallback para optimizar funciones que se ejecutan frecuentemente
 * 
 * @param callback - Función a debounce
 * @param delay - Delay en milisegundos (por defecto 500ms)
 * @param dependencies - Array de dependencias para el callback
 * @returns Función debounced
 * 
 * @example
 * const debouncedSearch = useDebounceCallback(
 *   (searchTerm: string) => {
 *     // Lógica de búsqueda
 *     apiCall(searchTerm);
 *   },
 *   500,
 *   []
 * );
 */
export const useDebounceCallback = (
  callback: (...args: any[]) => void,
  delay: number = 500
) => {
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  const debouncedCallback = (...args: any[]) => {
    // Limpiar timeout anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Crear nuevo timeout
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}; 

/**
 * Hook personalizado para actualización automática de datos
 * Utiliza la configuración global del usuario
 */
export function useAutoRefresh(callback: () => void, dependencies: any[] = []) {
  const { config } = useConfig();
  
  useEffect(() => {
    if (!config.autoRefresh) return;
    
    const interval = setInterval(callback, config.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [callback, config.autoRefresh, config.refreshInterval, ...dependencies]);
} 