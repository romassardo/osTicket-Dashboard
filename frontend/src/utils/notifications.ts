import logger from './logger';

/**
 * Solicita permiso al usuario para mostrar notificaciones nativas del navegador.
 * Solo pregunta si el permiso no ha sido concedido o denegado previamente.
 */
export const requestNotificationPermission = async (): Promise<void> => {
  if (!('Notification' in window)) {
    logger.warn('Este navegador no soporta notificaciones de escritorio.');
    return;
  }

  if (Notification.permission === 'default') {
    logger.info('Solicitando permiso para notificaciones...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      logger.info('Permiso para notificaciones concedido.');
    } else {
      logger.warn('Permiso para notificaciones denegado.');
    }
  }
};

/**
 * Muestra una notificación de nuevo ticket si el permiso ha sido concedido.
 * @param ticketNumber - El número del ticket para mostrar en la notificación.
 */
export const showNewTicketNotification = (ticketNumber: string): void => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('¡Nuevo Ticket Recibido!', {
      body: `Ha llegado el ticket #${ticketNumber}`,
      icon: '/vite.svg', // Opcional: puedes cambiar esto por el logo de OsTicket
      badge: '/vite.svg', // Icono para Android
      tag: 'new-ticket', // Agrupa notificaciones similares
    });

    // Opcional: enfocar la ventana al hacer clic en la notificación
    notification.onclick = () => {
      window.focus();
    };
  } else {
    logger.info('No se pueden mostrar notificaciones porque el permiso no ha sido concedido.');
  }
};
