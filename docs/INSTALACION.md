# 📦 Guía de Instalación - Dashboard OsTicket

## Requisitos Previos

### Software Necesario
- **Node.js** v18+ (recomendado v20)
- **npm** v9+ o **yarn** v1.22+
- **MySQL** 8.0+ (conexión a base de datos OsTicket existente)
- **Git** para clonar el repositorio

### Acceso
- Credenciales de lectura a la base de datos MySQL de OsTicket
- Usuario, contraseña, host y nombre de base de datos

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-osticket.git
cd dashboard-osticket
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

#### Configurar Variables de Entorno

Crear archivo `config/.env`:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=osticket
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# CORS (opcional)
CORS_ORIGIN=http://localhost:5173
```

#### Iniciar Backend

```bash
npm start
```

El servidor estará disponible en: **http://localhost:3001**

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

#### Configurar Proxy de Desarrollo

El archivo `vite.config.ts` ya está configurado para hacer proxy a `localhost:3001`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

#### Iniciar Frontend

```bash
npm run dev
```

El dashboard estará disponible en: **http://localhost:5173**

## 🧪 Verificar Instalación

### 1. Verificar Backend

Abrir en navegador o usar curl:

```bash
curl http://localhost:3001/api/tickets?page=1&limit=10
```

Respuesta esperada:
```json
{
  "tickets": [...],
  "pagination": {
    "total_items": 11602,
    "total_pages": 233,
    "current_page": 1,
    "per_page": 50
  }
}
```

### 2. Verificar Frontend

1. Abrir **http://localhost:5173**
2. Ver el dashboard con métricas
3. Probar navegación entre vistas
4. Verificar que los gráficos cargan datos

### 3. Probar Notificaciones

En consola del navegador (F12):

```javascript
window.testNotificationSound()
window.testAudioVisualSystem()
```

## 🛠️ Solución de Problemas Comunes

### Backend no conecta a MySQL

**Error:** `ECONNREFUSED` o `Access denied`

**Solución:**
1. Verificar credenciales en `.env`
2. Verificar que MySQL esté corriendo: `mysql -u tu_usuario -p`
3. Verificar permisos del usuario en MySQL
4. Verificar host (localhost vs 127.0.0.1 vs IP)

### Frontend no carga datos

**Error:** `Failed to fetch` en consola

**Solución:**
1. Verificar que backend esté corriendo en puerto 3001
2. Verificar proxy en `vite.config.ts`
3. Revisar CORS en backend si es necesario

### Build falla

**Error:** TypeScript errors

**Solución:**
```bash
cd frontend
npm run build --force
# o
npx tsc --noEmit
```

## 📊 Datos de Prueba

El dashboard lee datos directamente de la base de datos OsTicket. No requiere seeders ni datos de prueba adicionales.

### Verificar Tablas Requeridas

```sql
-- Verificar que existan las tablas necesarias
SHOW TABLES LIKE 'ost_%';

-- Verificar cantidad de tickets
SELECT COUNT(*) FROM ost_ticket;

-- Verificar estados
SELECT * FROM ost_ticket_status;
```

## 🔄 Actualizar Proyecto

```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install
```

## 📝 Notas Importantes

- El dashboard es **solo lectura** - no modifica datos de OsTicket
- Usa **Sequelize ORM** con configuración de solo lectura
- La conexión a MySQL debe tener **permisos SELECT únicamente**
- El puerto 3001 debe estar disponible para el backend
- El puerto 5173 debe estar disponible para desarrollo

## ⏭️ Próximos Pasos

Una vez instalado correctamente:

- Consultar **[Arquitectura](ARQUITECTURA.md)** para entender la estructura
- Consultar **[API](API.md)** para conocer los endpoints
- Consultar **[Despliegue](DESPLIEGUE.md)** para llevarlo a producción
- Consultar **[Guía de Usuario](GUIA_USUARIO.md)** para aprender a usar el dashboard
