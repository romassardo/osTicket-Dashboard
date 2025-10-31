# 🚀 INSTRUCCIONES DE DESPLIEGUE A PRODUCCIÓN

## ✅ Paso 1: COMPLETADO
- Commit realizado exitosamente (commit: 52709a8)
- Push a GitHub completado
- 24 archivos modificados/creados

## 📋 Paso 2: DESPLEGAR EN SERVIDOR

### Opción A: Usando el script automático

1. **Conectar al servidor**:
```bash
ssh soporte@4.236.168.145
# Contraseña: Cambiar1234
```

2. **Subir el script de despliegue**:
Desde tu PC Windows en otra terminal:
```bash
scp c:\Proyectos\OsTickets\dashboard-osticket\deploy-production.sh soporte@4.236.168.145:/tmp/
```

3. **Ejecutar el script en el servidor**:
```bash
chmod +x /tmp/deploy-production.sh
/tmp/deploy-production.sh
```

### Opción B: Comandos manuales paso a paso

Si prefieres ejecutar los comandos manualmente:

```bash
# 1. Conectar al servidor
ssh soporte@4.236.168.145

# 2. Ir al directorio del proyecto
cd /var/www/dashboardsop/dashboard-osticket

# 3. Backup del .env (importante!)
cp backend/config/.env backend/config/.env.backup

# 4. Actualizar código
git pull origin main

# 5. Actualizar dependencias backend
cd backend
npm install

# 6. Build del frontend
cd ../frontend
npm install
npm run build

# 7. Reiniciar backend
pm2 restart dashboard-osticket

# 8. Verificar logs
pm2 logs dashboard-osticket --lines 20

# 9. Ver estado
pm2 list
```

## 🎯 Cambios Desplegados

### Dashboard SLA - Soporte IT
- ✅ **Nuevos rangos SLA**:
  - Excelente: 90-100% (verde)
  - Regular: 70-89% (amarillo)
  - Crítico: 0-69% (rojo)

- ✅ **Nuevas vistas**:
  - Monitoreo SLA en Tiempo Real
  - Análisis Histórico SLA

- ✅ **Componentes creados**:
  - AgentComparisonChart (gráfico de barras)
  - SLADetailTable (tabla detallada)
  - SLAMetricsCards (tarjetas de métricas)
  - SLATrendChart (gráfico de evolución)

- ✅ **Backend optimizado**:
  - Endpoint `/api/sla/stats` mejorado
  - Endpoint `/api/sla/alerts` optimizado
  - Consolidación de datos por agente
  - Filtros por año/mes funcionales

- ✅ **Correcciones críticas**:
  - Filtrado de agentes que ya no trabajan (Roberto Gerhardt, Diego Gomez)
  - Conversión correcta de strings a números
  - Eliminación de duplicados en gráficos
  - Traducción de meses al español
  - Ordenamiento cronológico corregido

## 🔍 Verificación Post-Despliegue

Una vez completado el despliegue, verificar:

1. **Frontend carga**: https://soporteticket.ddns.net/dashboard/
2. **API responde**: https://soporteticket.ddns.net/api/tickets
3. **Dashboard SLA**: Click en "Dashboard SLA" en el sidebar
4. **Vista Monitoreo**: Click en "Monitoreo SLA"
5. **Vista Análisis**: Click en "Análisis SLA"

### Checklist de Funcionalidades

- [ ] Dashboard principal carga correctamente
- [ ] Sidebar muestra "Dashboard SLA", "Monitoreo SLA", "Análisis SLA"
- [ ] Vista "Análisis SLA" muestra:
  - [ ] Tarjetas con métricas
  - [ ] Gráfico "Top 5 Agentes por Cumplimiento SLA"
  - [ ] Gráfico "Distribución de Agentes"
  - [ ] Gráfico "Evolución SLA Mensual"
  - [ ] Tabla "Detalle Mensual por Agente"
- [ ] Vista "Monitoreo SLA" muestra:
  - [ ] Tarjetas de resumen
  - [ ] Tickets vencidos (si hay)
  - [ ] Tickets críticos (si hay)
  - [ ] Tickets en riesgo (si hay)
- [ ] Filtros por año/mes funcionan correctamente
- [ ] Los rangos de colores son correctos (90-100%, 70-89%, 0-69%)
- [ ] No aparecen Roberto Gerhardt ni Diego Gomez en los gráficos

## 🚨 Si Algo Falla

### Rollback rápido
```bash
cd /var/www/dashboardsop/dashboard-osticket
git log -1  # Ver último commit
git reset --hard HEAD~1  # Volver al commit anterior
pm2 restart dashboard-osticket
```

### Ver logs de error
```bash
pm2 logs dashboard-osticket --err --lines 50
```

### Restaurar .env
```bash
cp backend/config/.env.backup backend/config/.env
pm2 restart dashboard-osticket
```

## 📞 Contacto

Si tienes problemas durante el despliegue, documenta:
1. El comando exacto que ejecutaste
2. El error completo que recibiste
3. Los últimos 20 líneas de logs de PM2

---
**Última actualización**: 31 de Octubre 2025
**Commit desplegado**: 52709a8
**Total archivos**: 24 modificados
