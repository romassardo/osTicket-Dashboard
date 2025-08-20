import React, { createContext, useState, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Howl } from 'howler';
import logger from '../utils/logger';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playNotificationSound: (ticketData?: { number: string; subject: string }) => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const soundRef = useRef<Howl | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const fallbackSoundRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  // Crear sonido de fallback usando Web Audio API
  const createFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      fallbackSoundRef.current = () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        // Crear un tono simple (beep)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        logger.info('🔊 Sonido de fallback reproducido');
      };
      
      logger.info('✅ Sonido de fallback creado correctamente');
    } catch (error) {
      logger.error('❌ Error al crear sonido de fallback:', error);
    }
  };

  // Inicializar Howler.js tras la primera interacción del usuario
  const initializeSound = () => {
    if (isInitializedRef.current) {
      logger.debug('🔊 Sonido ya inicializado, omitiendo...');
      return;
    }
    
    try {
      logger.info('🔊 Inicializando sistema de sonido con Howler.js...');
      
      // Crear instancia de Howl con múltiples formatos para compatibilidad
      soundRef.current = new Howl({
        src: ['./notification.mp3', './notification.webm', './notification.ogg'],
        volume: 0.7,
        preload: true,
        onload: () => {
          logger.info('✅ Archivo de sonido cargado correctamente');
        },
        onloaderror: (id, error) => {
          logger.warn('⚠️ Error al cargar archivo de sonido:', error);
          // Crear un sonido de fallback usando Web Audio API
          logger.info('🔄 Creando sonido de fallback con Web Audio API...');
          createFallbackSound();
        },
        onplayerror: (id, error) => {
          logger.error('❌ Error al reproducir sonido:', error);
          // Manejar error de autoplay - esperar por unlock
          if (soundRef.current) {
            soundRef.current.once('unlock', () => {
              logger.info('🔓 Audio desbloqueado, reintentando reproducción...');
              soundRef.current?.play();
            });
          }
        },
        onplay: () => {
          logger.info('🔊 Sonido de notificación reproducido exitosamente');
        },
        onend: () => {
          logger.debug('🔇 Reproducción de sonido finalizada');
        }
      });
      
      isInitializedRef.current = true;
      logger.info('✅ Sistema de sonido inicializado correctamente con Howler.js');
      
      // Remover los listeners después de la inicialización exitosa
      document.removeEventListener('click', initializeSound);
      document.removeEventListener('keydown', initializeSound);
      document.removeEventListener('touchstart', initializeSound);
      document.removeEventListener('touchend', initializeSound);
    } catch (error) {
      logger.error('❌ Error al inicializar el sistema de sonido:', error);
      isInitializedRef.current = false;
    }
  };

  useEffect(() => {
    // Agregar listeners para múltiples tipos de interacción (incluyendo touchend para móviles)
    document.addEventListener('click', initializeSound, { once: true });
    document.addEventListener('keydown', initializeSound, { once: true });
    document.addEventListener('touchstart', initializeSound, { once: true });
    document.addEventListener('touchend', initializeSound, { once: true });

    return () => {
      document.removeEventListener('click', initializeSound);
      document.removeEventListener('keydown', initializeSound);
      document.removeEventListener('touchstart', initializeSound);
      document.removeEventListener('touchend', initializeSound);
      
      // Limpiar Howl al desmontar
      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled(prevState => !prevState);
  };

  const playNotificationSound = async (ticketData?: { number: string; subject: string }): Promise<void> => {
    // Disparar notificación visual si se proporcionan datos del ticket
    if (ticketData) {
      const event = new CustomEvent('showTicketNotification', { 
        detail: { 
          number: ticketData.number,
          subject: ticketData.subject
        } 
      });
      window.dispatchEvent(event);
    }

    if (!isSoundEnabled) {
      logger.debug('🔇 Sonido deshabilitado por el usuario');
      // Aunque el sonido esté deshabilitado, aún mostramos la notificación visual
      return;
    }

    if (!isInitializedRef.current) {
      logger.warn('⚠️ Sistema de sonido no inicializado. Esperando interacción del usuario.');
      // Intentar inicializar automáticamente
      initializeSound();
      return;
    }

    if (!soundRef.current) {
      logger.error('❌ Instancia de Howl no disponible');
      return;
    }

    try {
      // Verificar si el sonido está cargado
      if (soundRef.current.state() === 'loaded') {
        soundRef.current.play();
      } else if (soundRef.current.state() === 'loading') {
        logger.debug('⏳ Sonido aún cargando, esperando...');
        soundRef.current.once('load', () => {
          soundRef.current?.play();
        });
      } else {
        logger.warn('⚠️ Sonido no cargado, usando fallback...');
        // Si el archivo no se pudo cargar, usar el sonido de fallback
        if (fallbackSoundRef.current) {
          fallbackSoundRef.current();
        } else {
          logger.error('❌ Sonido de fallback no disponible');
        }
      }
    } catch (error) {
      logger.error('❌ Error al reproducir el sonido, intentando fallback:', error);
      // En caso de error, intentar usar el sonido de fallback
      if (fallbackSoundRef.current) {
        try {
          fallbackSoundRef.current();
        } catch (fallbackError) {
          logger.error('❌ Error también en sonido de fallback:', fallbackError);
        }
      }
    }
  };

  // Funciones globales para testing manual desde la consola
  useEffect(() => {
    (window as any).testNotificationSound = (ticketData?: { number: string; subject: string }) => {
      logger.info('🧪 Probando sonido manualmente desde consola...');
      playNotificationSound(ticketData);
    };

    (window as any).testAudioVisualSystem = () => {
      logger.info('🧪 Probando sistema audiovisual completo...');
      
      // Prueba 1: Notificación básica
      setTimeout(() => {
        playNotificationSound();
      }, 500);

      // Prueba 2: Notificación de ticket
      setTimeout(() => {
        playNotificationSound({ 
          number: "TEST-001", 
          subject: "Prueba del sistema de notificaciones" 
        });
      }, 2000);

      // Prueba 3: Notificación visual sin sonido
      setTimeout(() => {
        const event = new CustomEvent('showTestNotification', { 
          detail: { 
            title: '🎨 Solo Visual',
            message: 'Esta es una notificación solo visual (sin sonido)',
            type: 'success'
          } 
        });
        window.dispatchEvent(event);
      }, 4000);

      logger.info('✅ Secuencia de pruebas iniciada - observa las notificaciones en los próximos 5 segundos');
    };
    
    return () => {
      delete (window as any).testNotificationSound;
      delete (window as any).testAudioVisualSystem;
    };
  }, [playNotificationSound]);

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound, playNotificationSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
