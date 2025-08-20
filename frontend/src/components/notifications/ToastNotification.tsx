import React, { useEffect, useState } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';

interface ToastNotificationProps {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Mostrar la notificación con animación
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-cerrar después del tiempo especificado
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Tiempo de animación de salida
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500 dark:text-green-400';
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'error':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-blue-500 dark:text-blue-400';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`
        relative p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${getTypeStyles()}
      `}>
        {/* Icono y contenido */}
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            <BellIcon className="h-5 w-5" />
          </div>
          
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-semibold mb-1">
              {title}
            </h4>
            <p className="text-sm opacity-90">
              {message}
            </p>
          </div>
          
          {/* Botón de cerrar */}
          <button
            onClick={handleClose}
            className={`
              ml-2 flex-shrink-0 p-1 rounded-md
              hover:bg-black/10 dark:hover:bg-white/10
              transition-colors duration-200
              ${getIconColor()}
            `}
            aria-label="Cerrar notificación"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
          <div 
            className={`
              h-full bg-current opacity-30
              animate-[shrink_${duration}ms_linear_forwards]
            `}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  );
};

export default ToastNotification;
