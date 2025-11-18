import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import logger from '../utils/logger';

// Interfaces para la configuración
export interface AppConfig {
  // Configuración de paginación
  defaultTableSize: number;
  
  // Configuración de actualización automática
  autoRefresh: boolean;
  refreshInterval: number; // en segundos
  
  // Configuración de exportación
  defaultExportFormat: 'xlsx' | 'csv';
  
  // Configuraciones futuras pueden añadirse aquí
}

// Configuración por defecto
const DEFAULT_CONFIG: AppConfig = {
  defaultTableSize: 100,
  autoRefresh: true,
  refreshInterval: 30,
  defaultExportFormat: 'xlsx',
};

// Clave para localStorage
const CONFIG_STORAGE_KEY = 'osticket-dashboard-config';

// Tipo del contexto
interface ConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
  saveConfig: () => void;
  isDirty: boolean;
}

// Crear el contexto
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Props del provider
interface ConfigProviderProps {
  children: ReactNode;
}

// Hook personalizado para usar el contexto
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
  }
  return context;
};

// Función para cargar configuración desde localStorage
const loadConfigFromStorage = (): AppConfig => {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Combinar con valores por defecto para añadir nuevas configuraciones
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    logger.warn('Error al cargar configuración desde localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

// Función para guardar configuración en localStorage
const saveConfigToStorage = (config: AppConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    logger.info('Configuración guardada en localStorage');
  } catch (error) {
    logger.error('Error al guardar configuración en localStorage:', error);
  }
};

// Provider del contexto
export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(loadConfigFromStorage);
  const [savedConfig, setSavedConfig] = useState<AppConfig>(loadConfigFromStorage);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Cargar configuración al inicializar
  useEffect(() => {
    const loadedConfig = loadConfigFromStorage();
    setConfig(loadedConfig);
    setSavedConfig(loadedConfig);
    setIsDirty(false);
  }, []);

  // Detectar cambios no guardados
  useEffect(() => {
    const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
    setIsDirty(hasChanges);
  }, [config, savedConfig]);

  // Función para actualizar configuración (temporal, no persistente)
  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      logger.info('Configuración actualizada (temporal):', updates);
      return newConfig;
    });
  };

  // Función para guardar configuración permanentemente
  const saveConfig = () => {
    saveConfigToStorage(config);
    setSavedConfig(config);
    setIsDirty(false);
    logger.info('Configuración guardada permanentemente');
  };

  // Función para restablecer a valores por defecto
  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    saveConfigToStorage(DEFAULT_CONFIG);
    setSavedConfig(DEFAULT_CONFIG);
    setIsDirty(false);
    logger.info('Configuración restablecida a valores por defecto');
  };

  const value: ConfigContextType = {
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    isDirty,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}; 