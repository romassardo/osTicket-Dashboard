# 🚀 Guía de Despliegue a Producción - Dashboard OsTicket v1.2

## Servidor de Producción

**URL:** https://***REDACTED_DOMAIN***/dashboard/  
**Sistema Operativo:** Ubuntu 24.04 LTS  
**Servidor Web:** Apache 2.4 con SSL (Let's Encrypt)  
**Process Manager:** PM2

## 📋 Pre-requisitos

### Acceso al Servidor
```bash
ssh soporte@***REDACTED_SERVER_IP***
```

### Software Instalado
- Node.js v18+
- npm v9+
- PM2 (global)
- Apache 2.4
- MySQL 8.0+
- Git

## 🔧 Configuración del Servidor

### Estructura de Directorios

```
/var/www/dashboardsop/
├── frontend/
│   └── dist/              # Assets estáticos del frontend
│       ├── assets/        # JS y CSS compilados
│       ├── index.html
│       ├── notification.mp3
│       └── vite.svg
└── backend/               # API Node.js
    ├── config/
    ├── models/
    ├── routes/
    └── server.js
```

### Apache Configuration

Archivo: `/etc/apache2/sites-available/soporteticket.conf`

```apache
<VirtualHost *:443>
    ServerName ***REDACTED_DOMAIN***
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/***REDACTED_DOMAIN***/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/***REDACTED_DOMAIN***/privkey.pem
    
    # Redirección automática de /dashboard a /dashboard/
    RewriteEngine On
    RewriteRule ^/dashboard$ /dashboard/ [R=301,L]
    
    # Proxy al dashboard frontend
    ProxyPass /dashboard/ http://localhost:3001/
    ProxyPassReverse /dashboard/ http://localhost:3001/
    
    # Proxy a la API backend
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
    
    # Headers de seguridad
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/dashboard_error.log
    CustomLog ${APACHE_LOG_DIR}/dashboard_access.log combined
</VirtualHost>

# Redirección HTTP a HTTPS
<VirtualHost *:80>
    ServerName ***REDACTED_DOMAIN***
    Redirect permanent / https://***REDACTED_DOMAIN***/
</VirtualHost>
```

### PM2 Configuration

El backend corre bajo PM2 con el nombre `dashboard-osticket`:

```bash
# Ver status
pm2 status dashboard-osticket

# Ver logs
pm2 logs dashboard-osticket --lines 50

# Restart
pm2 restart dashboard-osticket

# Stop
pm2 stop dashboard-osticket

# Configuración de PM2 para auto-inicio
pm2 startup
pm2 save
```

## 📦 Proceso de Despliegue

### Paso 1: Build del Frontend (Local)

```bash
# En tu máquina local (Windows)
cd c:\Proyectos\OsTickets\dashboard-osticket\frontend
npm run build
```

Esto genera la carpeta `dist/` con:
- `index.html`
- `assets/` (JS y CSS compilados)
- `notification.mp3`
- `vite.svg`

### Paso 2: Subir Assets al Servidor

#### Opción A: SCP (Recomendado)

```bash
# Subir index.html
scp dist/index.html soporte@***REDACTED_SERVER_IP***:/tmp/dashboard-index.html

# Subir assets
scp -r dist/assets/* soporte@***REDACTED_SERVER_IP***:/tmp/dashboard-assets/

# Subir archivos estáticos
scp dist/notification.mp3 soporte@***REDACTED_SERVER_IP***:/tmp/
scp dist/vite.svg soporte@***REDACTED_SERVER_IP***:/tmp/
```

#### Opción B: Git Pull (Si frontend está en repo)

```bash
# En el servidor
cd /var/www/dashboardsop/frontend
git pull origin main
npm install
npm run build
```

### Paso 3: Mover Archivos a Ubicación Final

```bash
# Conectarse al servidor
ssh soporte@***REDACTED_SERVER_IP***

# Hacer backup del dist actual (opcional pero recomendado)
sudo mv /var/www/dashboardsop/frontend/dist /var/www/dashboardsop/frontend/dist.backup.$(date +%Y%m%d_%H%M%S)

# Crear nuevo directorio dist
sudo mkdir -p /var/www/dashboardsop/frontend/dist
sudo mkdir -p /var/www/dashboardsop/frontend/dist/assets

# Mover archivos desde /tmp
sudo mv /tmp/dashboard-index.html /var/www/dashboardsop/frontend/dist/index.html
sudo mv /tmp/dashboard-assets/* /var/www/dashboardsop/frontend/dist/assets/
sudo mv /tmp/notification.mp3 /var/www/dashboardsop/frontend/dist/
sudo mv /tmp/vite.svg /var/www/dashboardsop/frontend/dist/

# Ajustar permisos
sudo chown -R www-data:www-data /var/www/dashboardsop/frontend/dist
sudo chmod -R 755 /var/www/dashboardsop/frontend/dist
sudo chmod 644 /var/www/dashboardsop/frontend/dist/index.html
sudo chmod 644 /var/www/dashboardsop/frontend/dist/notification.mp3
sudo chmod 644 /var/www/dashboardsop/frontend/dist/vite.svg

# Verificar
ls -lh /var/www/dashboardsop/frontend/dist/
ls -lh /var/www/dashboardsop/frontend/dist/assets/ | head -10
```

### Paso 4: Actualizar Backend (Si hay cambios)

```bash
# Subir archivo modificado
scp backend/routes/ticketRoutes.js soporte@***REDACTED_SERVER_IP***:/tmp/

# En el servidor
sudo mv /tmp/ticketRoutes.js /var/www/dashboardsop/backend/routes/
sudo chown www-data:www-data /var/www/dashboardsop/backend/routes/ticketRoutes.js

# Si hay nuevas dependencias
cd /var/www/dashboardsop/backend
sudo npm install

# Reiniciar PM2
pm2 restart dashboard-osticket

# Verificar logs
pm2 logs dashboard-osticket --lines 20
```

### Paso 5: Reiniciar Apache (Si hay cambios en config)

```bash
# Verificar configuración
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2

# Verificar status
sudo systemctl status apache2
```

### Paso 6: Verificación

#### Check Backend

```bash
# Verificar que PM2 esté corriendo
pm2 status

# Probar endpoint local
curl http://localhost:3001/api/tickets?page=1&limit=5

# Ver logs en tiempo real
pm2 logs dashboard-osticket --lines 0
```

#### Check Frontend

1. Abrir navegador en **https://***REDACTED_DOMAIN***/dashboard/**
2. **Limpiar caché del navegador** (Ctrl+Shift+Delete)
3. O abrir en **modo incógnito**
4. Verificar que:
   - Dashboard carga correctamente
   - Métricas muestran datos
   - Gráficos se renderizan
   - Tabla de tickets funciona
   - Sonido de notificación funciona
   - No hay errores en consola (F12)

#### Check API

```bash
# Desde cualquier máquina
curl https://***REDACTED_DOMAIN***/api/tickets?page=1&limit=5
curl https://***REDACTED_DOMAIN***/api/tickets/stats
```

## 🔍 Troubleshooting

### Problema: Error 502 Bad Gateway

**Síntoma:** Apache devuelve 502 cuando accedes al dashboard

**Causa:** Backend no está corriendo o no responde en puerto 3001

**Solución:**
```bash
# Verificar PM2
pm2 status dashboard-osticket

# Si está stopped, iniciarlo
pm2 start dashboard-osticket

# Ver logs
pm2 logs dashboard-osticket
```

### Problema: Error 404 en /dashboard

**Síntoma:** Apache devuelve 404 Not Found

**Causa:** Archivos del frontend no están en `/var/www/dashboardsop/frontend/dist/`

**Solución:**
```bash
# Verificar que existan los archivos
ls -lh /var/www/dashboardsop/frontend/dist/

# Verificar permisos
ls -l /var/www/dashboardsop/frontend/dist/

# Deben ser www-data:www-data
```

### Problema: CSS/JS no cargan (404)

**Síntoma:** Dashboard carga pero sin estilos

**Causa:** Archivos en `assets/` no existen o no tienen permisos

**Solución:**
```bash
# Verificar assets
ls -lh /var/www/dashboardsop/frontend/dist/assets/

# Ajustar permisos
sudo chown -R www-data:www-data /var/www/dashboardsop/frontend/dist/assets
sudo chmod -R 755 /var/www/dashboardsop/frontend/dist/assets
```

### Problema: API devuelve CORS error

**Síntoma:** Frontend no puede conectar al backend

**Causa:** CORS mal configurado en backend

**Solución:**
```javascript
// En backend/server.js
app.use(cors({
  origin: 'https://***REDACTED_DOMAIN***',
  credentials: true
}));
```

### Problema: Certificado SSL expirado

**Síntoma:** "Your connection is not private"

**Causa:** Let's Encrypt certificado venció (cada 90 días)

**Solución:**
```bash
# Renovar certificado
sudo certbot renew

# Verificar renovación automática
sudo certbot renew --dry-run

# Restart Apache
sudo systemctl restart apache2
```

## 📊 Monitoreo

### Logs a Revisar

```bash
# Logs del backend (PM2)
pm2 logs dashboard-osticket

# Logs de Apache
sudo tail -f /var/log/apache2/dashboard_error.log
sudo tail -f /var/log/apache2/dashboard_access.log

# Logs del sistema
sudo journalctl -u apache2 -f
```

### Métricas de PM2

```bash
# Uso de recursos
pm2 monit

# Información detallada
pm2 show dashboard-osticket

# Restart count (debería ser bajo)
pm2 status
```

## 🔐 Seguridad

### Checklist

- [ ] SSL/TLS habilitado (Let's Encrypt)
- [ ] Certificado renovado automáticamente
- [ ] Usuario MySQL con permisos solo SELECT
- [ ] Firewall configurado (solo 80, 443, 22)
- [ ] PM2 corriendo como usuario no-root
- [ ] Apache con headers de seguridad
- [ ] Backups regulares de `.env` y configuraciones

### Backups

```bash
# Backup de configuración
sudo tar -czf /backups/dashboard-config-$(date +%Y%m%d).tar.gz \
  /var/www/dashboardsop/backend/config/.env \
  /etc/apache2/sites-available/soporteticket.conf

# Backup de frontend dist
sudo tar -czf /backups/dashboard-dist-$(date +%Y%m%d).tar.gz \
  /var/www/dashboardsop/frontend/dist/
```

## 🔄 Rollback

Si algo sale mal después del despliegue:

```bash
# Restaurar backup de frontend
sudo rm -rf /var/www/dashboardsop/frontend/dist
sudo mv /var/www/dashboardsop/frontend/dist.backup.YYYYMMDD_HHMMSS /var/www/dashboardsop/frontend/dist

# Restart backend a versión anterior
cd /var/www/dashboardsop/backend
git checkout <commit-hash-anterior>
pm2 restart dashboard-osticket

# Restart Apache
sudo systemctl restart apache2
```

## 📝 Checklist de Despliegue

Antes de cada despliegue, verificar:

- [ ] Tests locales pasando
- [ ] Build de frontend exitoso (`npm run build`)
- [ ] No hay errores en consola del navegador
- [ ] Backup del dist actual creado
- [ ] PM2 status OK antes del despliegue
- [ ] Notificar a usuarios si es despliegue mayor

Durante el despliegue:

- [ ] Archivos subidos correctamente
- [ ] Permisos ajustados (www-data:www-data)
- [ ] PM2 restart exitoso
- [ ] Apache restart (si necesario)
- [ ] Verificación en navegador

Post-despliegue:

- [ ] Dashboard carga sin errores
- [ ] API responde correctamente
- [ ] Sonido de notificaciones funciona
- [ ] No hay errores 404 en assets
- [ ] Logs de PM2 sin errores
- [ ] Actualizar CHANGELOG.md

---

**Última actualización:** Octubre 2025  
**Versión:** v1.2
