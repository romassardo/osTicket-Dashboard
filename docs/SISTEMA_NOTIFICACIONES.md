# 🔊📢 Sistema de Notificaciones Audiovisuales

## Descripción General

El sistema de notificaciones audiovisuales combina sonido y notificaciones visuales para proporcionar una experiencia completa de alertas en tiempo real. Utiliza **Howler.js** para el manejo de audio y **React Context** para las notificaciones visuales.

## 🎯 Características Principales

### 🔊 Sistema de Sonido
- **Motor principal**: Howler.js para máxima compatibilidad entre navegadores
- **Sonido de fallback**: Beep sintético usando Web Audio API si el archivo MP3 falla
- **Manejo robusto de errores**: Múltiples capas de fallback
- **Soporte para segundo plano**: Funciona con navegador minimizado o pestañas inactivas
- **Políticas de autoplay**: Manejo automático de restricciones de navegadores

### 📢 Sistema de Notificaciones Visuales
- **Notificaciones toast modernas**: Animaciones suaves y diseño atractivo
- **Tipos de notificación**: info, success, warning, error con colores apropiados
- **Auto-cierre temporizado**: Con barra de progreso visual
- **Apilamiento inteligente**: Múltiples notificaciones organizadas
- **Diseño responsivo**: Compatible con modo oscuro y dispositivos móviles
- **Accesibilidad**: ARIA labels y soporte para lectores de pantalla

### 🔗 Integración Audiovisual
- **Coordinación automática**: Entre sonido y notificación visual
- **Notificación visual garantizada**: Incluso si el sonido falla
- **Eventos personalizados**: Comunicación entre sistemas
- **Funciones de prueba**: Disponibles desde la consola del navegador

## 📁 Estructura de Archivos

```
frontend/src/
├── context/
│   ├── SoundContext.tsx           # Contexto de sonido con Howler.js
│   └── NotificationContext.tsx    # Contexto de notificaciones visuales
├── components/
│   └── notifications/
│       └── ToastNotification.tsx  # Componente de notificación toast
└── App.tsx                        # Integración de ambos sistemas
```

## 🚀 Instalación y Configuración

### Dependencias Requeridas
```bash
npm install howler @types/howler
```

### Archivos de Audio
Coloca el archivo `notification.mp3` en la carpeta `frontend/public/`:
```
frontend/public/notification.mp3
```

### Integración en la Aplicación
El sistema ya está integrado en `App.tsx` con los providers necesarios:
```tsx
<SoundProvider>
  <NotificationProvider>
    {/* Tu aplicación */}
  </NotificationProvider>
</SoundProvider>
```

## 🧪 Funciones de Prueba

### Desde la Consola del Navegador

#### Prueba Básica de Sonido
```javascript
window.testNotificationSound()
```

#### Prueba con Datos de Ticket
```javascript
window.testNotificationSound({ 
  number: "12345", 
  subject: "Problema con impresora" 
})
```

#### Prueba del Sistema Completo
```javascript
window.testAudioVisualSystem()
```
*Ejecuta una secuencia de 3 pruebas diferentes en 5 segundos*

#### Prueba Solo Notificación Visual
```javascript
window.testToastNotification('success')  // 'info', 'warning', 'error'
```

## 🔧 Uso en Componentes

### Hook de Sonido
```tsx
import { useSound } from '../context/SoundContext';

const MyComponent = () => {
  const { isSoundEnabled, toggleSound, playNotificationSound } = useSound();
  
  const handleNewTicket = async () => {
    await playNotificationSound({ 
      number: "TKT-001", 
      subject: "Nuevo ticket creado" 
    });
  };
};
```

### Hook de Notificaciones
```tsx
import { useNotifications } from '../context/NotificationContext';

const MyComponent = () => {
  const { showNotification, showTicketNotification } = useNotifications();
  
  const handleSuccess = () => {
    showNotification({
      title: '✅ Éxito',
      message: 'Operación completada correctamente',
      type: 'success'
    });
  };
};
```

## 🎛️ Configuración Avanzada

### Personalizar Duración de Notificaciones
```tsx
showNotification({
  title: 'Mi Notificación',
  message: 'Mensaje personalizado',
  type: 'info',
  duration: 8000  // 8 segundos
});
```

### Configurar Volumen de Sonido
En `SoundContext.tsx`, línea 37:
```tsx
soundRef.current = new Howl({
  src: ['./notification.mp3'],
  volume: 0.7,  // Ajustar entre 0.0 y 1.0
  // ...
});
```

## 🔍 Solución de Problemas

### El sonido no se reproduce
1. **Verifica la inicialización**: Haz clic en cualquier parte de la página
2. **Revisa la consola**: Busca errores de carga del archivo MP3
3. **Prueba el fallback**: El beep sintético debería funcionar siempre
4. **Verifica permisos**: Algunos navegadores bloquean audio automático

### Las notificaciones no aparecen
1. **Revisa la integración**: Asegúrate de que `NotificationProvider` esté en `App.tsx`
2. **Verifica eventos**: Los eventos personalizados deben dispararse correctamente
3. **Revisa z-index**: Las notificaciones usan `z-50`

### Problemas en producción
1. **Ruta del archivo**: Asegúrate de que `notification.mp3` esté en el servidor
2. **HTTPS requerido**: Algunos navegadores requieren HTTPS para audio
3. **Políticas de Content Security Policy**: Pueden bloquear audio inline

## 📊 Logs y Debugging

El sistema genera logs detallados en la consola:
- `🔊` Inicialización de audio
- `📢` Notificaciones mostradas
- `⚠️` Advertencias y fallbacks
- `❌` Errores y recuperación

Para debugging avanzado:
```javascript
// Habilitar logs detallados de Howler.js
Howler.volume(1.0);  // Volumen máximo para pruebas
```

## 🚀 Despliegue a Producción

### Checklist Pre-Despliegue
- [ ] Archivo `notification.mp3` en `frontend/public/`
- [ ] Build del frontend completado
- [ ] Pruebas de sonido y notificaciones funcionando
- [ ] Verificar compatibilidad con navegadores objetivo
- [ ] Probar en dispositivos móviles

### Archivos a Subir
```bash
# Backend
backend/routes/ticketRoutes.js  # (si hay cambios relacionados)

# Frontend
frontend/dist/*  # Todo el contenido del build
```

### Comandos de Despliegue
```bash
# Build del frontend
cd frontend
npm run build

# Subir archivos (ejemplo con SCP)
scp -r frontend/dist/* usuario@servidor:/var/www/dashboardsop/frontend/dist/

# Reiniciar servicios en el servidor
ssh usuario@servidor "pm2 restart dashboard-osticket && sudo systemctl restart apache2"
```

## 📈 Métricas y Monitoreo

El sistema registra automáticamente:
- Inicializaciones de audio exitosas/fallidas
- Notificaciones mostradas por tipo
- Uso de sonido vs. solo visual
- Errores de carga de archivos de audio

## 🔮 Futuras Mejoras

- [ ] Soporte para múltiples sonidos personalizados
- [ ] Notificaciones push del navegador
- [ ] Integración con vibración en móviles
- [ ] Configuración de usuario persistente
- [ ] Analytics de engagement con notificaciones

---

*Documentación actualizada: Agosto 2025*
*Sistema implementado con Context7 MCP y mejores prácticas web modernas*
