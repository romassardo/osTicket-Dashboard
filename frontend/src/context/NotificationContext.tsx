import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import ToastNotification from '../components/notifications/ToastNotification';
import logger from '../utils/logger';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showTicketNotification: (ticketNumber: string, subject: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Escuchar eventos personalizados del sistema de sonido
  useEffect(() => {
    const handleTicketNotification = (event: CustomEvent) => {
      const { number, subject } = event.detail;
      showTicketNotification(number, subject);
    };

    const handleTestNotification = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      showNotification({ title, message, type });
    };

    window.addEventListener('showTicketNotification', handleTicketNotification as EventListener);
    window.addEventListener('showTestNotification', handleTestNotification as EventListener);

    return () => {
      window.removeEventListener('showTicketNotification', handleTicketNotification as EventListener);
      window.removeEventListener('showTestNotification', handleTestNotification as EventListener);
    };
  }, []);

  const showNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);
    logger.info(`📢 Notificación mostrada: ${notification.title}`);
  }, [generateId]);

  const showTicketNotification = useCallback((ticketNumber: string, subject: string) => {
    showNotification({
      title: '🎫 Nuevo Ticket',
      message: `#${ticketNumber}: ${subject}`,
      type: 'info',
      duration: 6000 // Un poco más de tiempo para tickets
    });
  }, [showNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    logger.info('🧹 Todas las notificaciones eliminadas');
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        showNotification, 
        showTicketNotification, 
        clearAllNotifications 
      }}
    >
      {children}
      
      {/* Renderizar todas las notificaciones activas */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index
            }}
          >
            <ToastNotification
              {...notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Función global para testing manual desde la consola
if (typeof window !== 'undefined') {
  (window as any).testToastNotification = (type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const event = new CustomEvent('showTestNotification', { 
      detail: { 
        title: '🧪 Notificación de Prueba',
        message: `Esta es una notificación de prueba de tipo ${type}`,
        type 
      } 
    });
    window.dispatchEvent(event);
  };
}
