#!/bin/bash
# Script de despliegue para Dashboard OsTicket SLA
# Ejecutar en el servidor de producción

echo "=== DESPLIEGUE DASHBOARD SLA - PRODUCCIÓN ==="
echo ""

# 1. Ir al directorio del proyecto
cd /var/www/dashboardsop/dashboard-osticket || { echo "Error: No se encuentra el directorio"; exit 1; }

echo "✓ Directorio del proyecto: $(pwd)"
echo ""

# 2. Verificar rama actual
echo "Rama actual: $(git branch --show-current)"
echo ""

# 3. Hacer backup del .env
echo "Creando backup de configuración..."
cp backend/config/.env backend/config/.env.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup creado"
echo ""

# 4. Hacer git pull
echo "Descargando últimos cambios desde GitHub..."
git pull origin main
echo "✓ Código actualizado"
echo ""

# 5. Instalar dependencias del backend
echo "Instalando dependencias del backend..."
cd backend
npm install
echo "✓ Dependencias backend instaladas"
echo ""

# 6. Volver al root y hacer build del frontend
cd ../frontend
echo "Construyendo frontend..."
npm install
npm run build
echo "✓ Frontend construido"
echo ""

# 7. Reiniciar backend con PM2
echo "Reiniciando backend..."
pm2 restart dashboard-osticket
echo "✓ Backend reiniciado"
echo ""

# 8. Ver logs
echo "Logs del backend (últimas 20 líneas):"
pm2 logs dashboard-osticket --lines 20 --nostream
echo ""

# 9. Verificar estado
echo "Estado de los procesos PM2:"
pm2 list
echo ""

echo "=== DESPLIEGUE COMPLETADO ==="
echo ""
echo "URLs para verificar:"
echo "  - Frontend: https://soporteticket.ddns.net/dashboard/"
echo "  - API Test: https://soporteticket.ddns.net/api/tickets"
echo "  - Dashboard SLA: https://soporteticket.ddns.net/dashboard/sla-stats"
echo ""
