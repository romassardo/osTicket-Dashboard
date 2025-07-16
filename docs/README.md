# Dashboard IT - OsTicket

Este proyecto tiene como objetivo desarrollar un dashboard web personalizado, solo de lectura, que visualice la información clave de tickets del sistema OsTicket. Permitirá el filtrado, análisis y visualización de datos para mejorar la toma de decisiones y el seguimiento del rendimiento del soporte técnico.

## Características Principales (Planeadas)

- Resumen general de tickets (totales, abiertos, cerrados, pendientes).
- Métricas de rendimiento (tiempo promedio de respuesta, tasa de resolución).
- Gráficos de evolución de tickets (por día, semana, mes).
- Análisis de tickets por agente y por departamento.
- Distribución de tickets por estado y prioridad.
- Tabla detallada de tickets con búsqueda y paginación.
- (Opcional) Exportación de datos a CSV/PDF.

## Tecnologías

- **Backend:** Node.js + Express
- **Frontend:** React.js con TypeScript, Vite, Tailwind CSS, React Query y Axios
- **Base de Datos:** MySQL (conexión de solo lectura a la base de datos de OsTicket)
- **ORM:** Sequelize (para Node.js)
- **Gráficos:** Recharts (preferido), Chart.js

## Estructura del Proyecto

```
/dashboard-osticket/
 backend/                # Lógica del servidor y API
    routes/             # Definición de rutas de la API
    server.js           # (o app.py) Archivo principal del backend
 frontend/               # Interfaz de usuario web
    public/             # Archivos estáticos públicos
    src/                # Código fuente del frontend
        components/     # Componentes reutilizables de la interfaz
 sql/                    # Consultas SQL de referencia
 .env.example            # Ejemplo de variables de entorno necesarias
 README.md               # Este archivo
 CHANGELOGTO.md     # Plan detallado de tareas
```

## Próximos Pasos

Consultar `CHANGELOG.md` para el seguimiento detallado de las tareas.
