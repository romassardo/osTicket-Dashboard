import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Tipos para el contexto de tema
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** Tema actual configurado por el usuario (puede incluir 'system') */
  theme: Theme;
  /** Tema resuelto actual (light o dark) aplicado al sistema */
  resolvedTheme: ResolvedTheme;
  /** Función para cambiar el tema */
  setTheme: (theme: Theme) => void;
  /** Toggle entre light y dark (ignora system) */
  toggleTheme: () => void;
}

// Crear el contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Clave para localStorage
const THEME_STORAGE_KEY = 'osticket-dashboard-theme';

// Función para detectar la preferencia del sistema
const getSystemPreference = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Función para obtener el tema inicial
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {
    console.warn('Error al leer el tema desde localStorage:', error);
  }
  
  // Por defecto usar el tema del sistema
  return 'system';
};

// Función para resolver el tema (convertir 'system' a 'light' o 'dark')
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') {
    return getSystemPreference();
  }
  return theme;
};

// Props del provider
interface ThemeProviderProps {
  children: ReactNode;
  /** Tema por defecto si no hay uno guardado */
  defaultTheme?: Theme;
  /** Atributo a aplicar al elemento HTML (por defecto 'class') */
  attribute?: string;
  /** Clase CSS para el modo oscuro (por defecto 'dark') */
  darkClass?: string;
  /** Clase CSS para el modo claro (por defecto ninguna) */
  lightClass?: string;
}

/**
 * Proveedor del contexto de tema
 * Gestiona el estado del tema, persistencia y aplicación de clases CSS
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  attribute = 'class',
  darkClass = 'dark',
  lightClass = ''
}) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => 
    resolveTheme(getInitialTheme())
  );

  // Función para aplicar el tema al DOM
  const applyTheme = React.useCallback((newResolvedTheme: ResolvedTheme) => {
    const root = document.documentElement;
    
    if (attribute === 'class') {
      // Remover clases existentes (solo si no están vacías)
      if (darkClass) root.classList.remove(darkClass);
      if (lightClass) root.classList.remove(lightClass);
      
      // Aplicar la clase correspondiente
      if (newResolvedTheme === 'dark' && darkClass) {
        root.classList.add(darkClass);
      } else if (newResolvedTheme === 'light' && lightClass) {
        root.classList.add(lightClass);
      }
      
      // Forzar re-render al actualizar atributo data-theme para debugging
      root.setAttribute('data-theme', newResolvedTheme);
      
      // Forzar actualización de propiedades CSS custom si es necesario
      if (newResolvedTheme === 'light') {
        // Asegurar que las variables CSS se actualicen correctamente
        root.style.setProperty('color-scheme', 'light');
      } else {
        root.style.setProperty('color-scheme', 'dark');
      }
    } else {
      // Usar atributo personalizado
      root.setAttribute(attribute, newResolvedTheme);
    }
  }, [attribute, darkClass, lightClass]);

  // Función para cambiar el tema
  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Persistir en localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn('Error al guardar el tema en localStorage:', error);
    }
    
    // Resolver y aplicar el tema
    const newResolvedTheme = resolveTheme(newTheme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
  }, [applyTheme]);

  // Función para alternar entre light y dark
  const toggleTheme = React.useCallback(() => {
    const currentResolved = resolveTheme(theme);
    const newTheme: ResolvedTheme = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Efecto para escuchar cambios en la preferencia del sistema
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newResolvedTheme = getSystemPreference();
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    // Escuchar cambios
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  // Efecto para aplicar el tema inicial
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [applyTheme, resolvedTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para usar el contexto de tema
 * @returns Contexto de tema con todas las funciones disponibles
 * @throws Error si se usa fuera del ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  
  return context;
};

/**
 * Hook simplificado para obtener solo el tema resuelto
 * @returns El tema actual resuelto ('light' o 'dark')
 */
export const useResolvedTheme = (): ResolvedTheme => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
};

/**
 * Hook para verificar si el tema actual es oscuro
 * @returns true si el tema actual es oscuro
 */
export const useIsDark = (): boolean => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
};

export default ThemeProvider; 